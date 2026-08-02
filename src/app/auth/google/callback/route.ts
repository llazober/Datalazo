import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', req.url));
  }

  const clientID = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectURI = process.env.GOOGLE_REDIRECT_URI || 'https://datalazo.net/auth/google/callback';

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientID,
        client_secret: clientSecret,
        redirect_uri: redirectURI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('[OAuth Callback] Token error:', tokenData);
      return NextResponse.redirect(new URL('/login?error=token_failed', req.url));
    }

    // Retrieve Google user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // Redirect user back to /dashboard
    const res = NextResponse.redirect(new URL('/dashboard', req.url));

    // Save session cookie
    res.cookies.set('user_session', JSON.stringify({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return res;
  } catch (err) {
    console.error('[OAuth Callback] Exception:', err);
    return NextResponse.redirect(new URL('/login?error=server_error', req.url));
  }
}
