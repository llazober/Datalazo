import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Try new user_profile cookie first, then legacy user_session
  const profileCookie = req.cookies.get('user_profile');
  const legacyCookie = req.cookies.get('user_session');

  const rawCookie = profileCookie || legacyCookie;

  if (!rawCookie?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const userData = JSON.parse(rawCookie.value);
    // Only return safe profile fields, never tokens
    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
