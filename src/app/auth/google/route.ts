import { NextResponse } from 'next/server';

export async function GET() {
  const clientID = process.env.GOOGLE_CLIENT_ID || '';
  const redirectURI = process.env.GOOGLE_REDIRECT_URI || 'https://datalazo.net/auth/google/callback';

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
