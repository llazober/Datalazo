import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signPayload, getClientIp, getClientHost, getCookieDomain } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find user and include their client metadata
    const user = await prisma.clientUser.findUnique({
      where: { username },
      include: { client: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValidPassword = verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Log the successful login attempt
    const ip = getClientIp(req);
    const host = getClientHost(req);
    const userAgent = req.headers.get('user-agent') || 'Unknown User Agent';
    const site = (host && host !== 'localhost' && host !== '127.0.0.1')
      ? host
      : (user.client?.subdomain ? `${user.client.subdomain}.datalazo.net` : user.client?.company || user.client?.name || 'Client Portal');

    try {
      await prisma.clientUserLogin.create({
        data: {
          userId: user.id,
          ip,
          userAgent
        }
      });

      await prisma.loginLog.create({
        data: {
          username: user.username,
          site,
          ipAddress: ip,
          userAgent
        }
      });
    } catch (dbErr) {
      console.error('Error logging client login:', dbErr);
    }

    const sessionData = JSON.stringify({
      userId: user.id,
      clientId: user.clientId,
      username: user.username,
      termsAccepted: user.termsAccepted
    });

    const signedSession = signPayload(sessionData);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        termsAccepted: user.termsAccepted,
        clientId: user.clientId,
        clientName: user.client.name
      }
    });

    // Set client_session cookie with optional wildcard domain support for *.datalazo.net
    const cookieDomain = getCookieDomain(req);
    response.cookies.set('client_session', signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {})
    });

    return response;
  } catch (error) {
    console.error('Client login API error:', error);
    return NextResponse.json({ error: 'Server error during login' }, { status: 500 });
  }
}
