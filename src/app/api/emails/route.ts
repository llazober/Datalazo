import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('user_session');

  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    const accessToken = session.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    // List latest 10 messages from Gmail
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=label:INBOX',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const listData = await listRes.json();

    if (!listRes.ok) {
      return NextResponse.json({ error: listData.error?.message || 'Failed to list Gmail messages' }, { status: listRes.status });
    }

    const messageList = listData.messages || [];

    // Fetch details for each message
    const detailedEmails = await Promise.all(
      messageList.map(async (msg: { id: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const detail = await detailRes.json();

          const headers = detail.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          const from = getHeader('From');
          const subject = getHeader('Subject') || '(No Subject)';
          const date = getHeader('Date');
          const snippet = detail.snippet || '';

          // Parse from name and email
          const fromMatch = from.match(/^(?:"?([^"]*)"?\s)?(?:<(.+)>)?$/);
          const fromName = fromMatch?.[1] || fromMatch?.[2] || from;
          const fromEmail = fromMatch?.[2] || fromMatch?.[1] || from;

          return {
            id: detail.id,
            threadId: detail.threadId,
            fromName,
            fromEmail,
            subject,
            snippet,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            isRead: !detail.labelIds?.includes('UNREAD'),
            isStarred: detail.labelIds?.includes('STARRED'),
          };
        } catch {
          return null;
        }
      })
    );

    const validEmails = detailedEmails.filter(Boolean);

    return NextResponse.json({ emails: validEmails });
  } catch (err: any) {
    console.error('[API Emails] Exception:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
