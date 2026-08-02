import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('user_session');

  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const userData = JSON.parse(sessionCookie.value);
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
