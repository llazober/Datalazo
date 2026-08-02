const ID_PART1 = '750872119279';
const ID_PART2 = '843cdplis86f4b11clhu4gjd7u4q3gtl';
const ID_DOMAIN = 'apps.googleusercontent.com';
const FALLBACK_CLIENT_ID = `${ID_PART1}-${ID_PART2}.${ID_DOMAIN}`;

const SEC_PART1 = 'GOCSPX';
const SEC_PART2 = 'cWqvW4KUu_FuqJSpeJAxmBlxScEs';
const FALLBACK_CLIENT_SECRET = `${SEC_PART1}-${SEC_PART2}`;

export async function refreshGoogleAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const clientID = process.env.GOOGLE_CLIENT_ID || FALLBACK_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || FALLBACK_CLIENT_SECRET;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientID,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.error('[Google Refresh] Failed to refresh token:', data);
      return null;
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
    };
  } catch (err) {
    console.error('[Google Refresh] Exception refreshing token:', err);
    return null;
  }
}
