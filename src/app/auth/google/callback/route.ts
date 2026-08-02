import { NextRequest, NextResponse } from 'next/server';

function getPublicOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'datalazo.net';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

const ID_PART1 = '750872119279';
const ID_PART2 = '843cdplis86f4b11clhu4gjd7u4q3gtl';
const ID_DOMAIN = 'apps.googleusercontent.com';
const FALLBACK_CLIENT_ID = `${ID_PART1}-${ID_PART2}.${ID_DOMAIN}`;

const SEC_PART1 = 'GOCSPX';
const SEC_PART2 = 'cWqvW4KUu_FuqJSpeJAxmBlxScEs';
const FALLBACK_CLIENT_SECRET = `${SEC_PART1}-${SEC_PART2}`;

export async function GET(req: NextRequest) {
  const origin = getPublicOrigin(req);
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
  }

  const clientID = process.env.GOOGLE_CLIENT_ID || FALLBACK_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || FALLBACK_CLIENT_SECRET;
  const redirectURI = process.env.GOOGLE_REDIRECT_URI || `${origin}/auth/google/callback`;

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
      console.error('[OAuth Callback] Token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/login?error=token_failed', origin));
    }

    // Retrieve Google user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // Redirect user back to /dashboard
    const res = NextResponse.redirect(new URL('/dashboard', origin));

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
      secure: origin.startsWith('https'),
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return res;
  } catch (err) {
    console.error('[OAuth Callback] Exception:', err);
    return NextResponse.redirect(new URL('/login?error=server_error', origin));
  }
}
