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

export async function GET(req: NextRequest) {
  const origin = getPublicOrigin(req);
  const clientID = process.env.GOOGLE_CLIENT_ID || FALLBACK_CLIENT_ID;
  const redirectURI = process.env.GOOGLE_REDIRECT_URI || `${origin}/auth/google/callback`;

  const scopes = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar',
    'profile',
    'email',
  ].join(' ');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientID);
  googleAuthUrl.searchParams.set('redirect_uri', redirectURI);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', scopes);
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(googleAuthUrl.toString());
}
