import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySignedPayload, signPayload } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('client_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payloadStr = verifySignedPayload(sessionCookie.value);
    if (!payloadStr) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const session = JSON.parse(payloadStr);
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid user in session' }, { status: 401 });
    }

    // Capture metadata
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Update DB
    const updatedUser = await prisma.clientUser.update({
      where: { id: userId },
      data: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsAcceptedIp: ip,
        termsAcceptedUserAgent: userAgent,
      },
    });

    // Update the session cookie with termsAccepted: true
    const updatedSessionData = JSON.stringify({
      userId: updatedUser.id,
      clientId: updatedUser.clientId,
      username: updatedUser.username,
      termsAccepted: true
    });

    const signedSession = signPayload(updatedSessionData);

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        termsAccepted: true
      }
    });

    response.cookies.set('client_session', signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Accept terms API error:', error);
    return NextResponse.json({ error: 'Server error accepting terms' }, { status: 500 });
  }
}
