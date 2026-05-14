import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    // Use environment variable or default
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'datalazo2025';

    if (password === ADMIN_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // Set a secure cookie for the session
      response.cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
