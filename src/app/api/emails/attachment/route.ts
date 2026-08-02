import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const tokensCookie = req.cookies.get('user_tokens');
  const legacyCookie = req.cookies.get('user_session');

  let accessToken: string | null = null;
  if (tokensCookie?.value) {
    try {
      const tokens = JSON.parse(tokensCookie.value);
      accessToken = tokens.accessToken || null;
    } catch {}
  }
  if (!accessToken && legacyCookie?.value) {
    try {
      const session = JSON.parse(legacyCookie.value);
      accessToken = session.accessToken || null;
    } catch {}
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const messageId = req.nextUrl.searchParams.get('messageId');
  const attachmentId = req.nextUrl.searchParams.get('attachmentId');
  const filename = req.nextUrl.searchParams.get('filename') || 'attachment';
  const mimeType = req.nextUrl.searchParams.get('mimeType') || 'application/octet-stream';

  if (!messageId || !attachmentId) {
    return NextResponse.json({ error: 'Missing messageId or attachmentId' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.error?.message || 'Failed to fetch attachment' }, { status: res.status });
    }

    const data = await res.json();
    const base64Data = data.data.replace(/-/g, '+').replace(/_/g, '/');
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error downloading attachment' }, { status: 500 });
  }
}
