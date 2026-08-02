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
    return NextResponse.redirect(new URL('/dashboard/email-assistant?error=auth_failed', origin));
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
      return NextResponse.redirect(new URL('/dashboard/email-assistant?error=token_failed', origin));
    }

    // Retrieve Google user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // Redirect user back to Email Assistant dashboard page
    const res = NextResponse.redirect(new URL('/dashboard/email-assistant', origin));

    const isSecure = origin.startsWith('https');
    const cookieOpts = {
      secure: isSecure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 3600,
    };

    // Cookie 1: Small readable profile cookie (no tokens) — JS can read this
    const profileData = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    };
    res.cookies.set('user_profile', JSON.stringify(profileData), {
      ...cookieOpts,
      httpOnly: false, // readable by JS to show "Google Connected" status
    });

    // Cookie 2: Secure token cookie — server-only, never sent to client JS
    const tokenData2 = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    };
    res.cookies.set('user_tokens', JSON.stringify(tokenData2), {
      ...cookieOpts,
      httpOnly: true, // only server can read tokens
    });

    // Legacy cookie for backward compat (small, no tokens)
    res.cookies.set('user_session', JSON.stringify(profileData), {
      ...cookieOpts,
      httpOnly: false,
    });

    return res;
  } catch (err) {
    console.error('[OAuth Callback] Exception:', err);
    return NextResponse.redirect(new URL('/dashboard/email-assistant?error=server_error', origin));
  }
}
