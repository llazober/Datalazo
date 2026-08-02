import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Try user_tokens first (new secure cookie), fall back to legacy user_session
  const tokensCookie = req.cookies.get('user_tokens');
  const legacyCookie = req.cookies.get('user_session');

  let accessToken: string | null = null;

  if (tokensCookie?.value) {
    try {
      const tokens = JSON.parse(tokensCookie.value);
      accessToken = tokens.accessToken || null;
    } catch {}
  }

  // Fallback: legacy user_session may still have accessToken
  if (!accessToken && legacyCookie?.value) {
    try {
      const session = JSON.parse(legacyCookie.value);
      accessToken = session.accessToken || null;
    } catch {}
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated. Please sign in with Google first.' },
      { status: 401 }
    );
  }

  try {
    // List latest 15 messages from Gmail inbox
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=label:INBOX',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const listData = await listRes.json();

    if (!listRes.ok) {
      console.error('[API Emails] Gmail list error:', listData);
      // Token may be expired — signal client to re-auth
      if (listRes.status === 401) {
        return NextResponse.json(
          { error: 'Google access token expired. Please disconnect and sign in again.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: listData.error?.message || 'Failed to list Gmail messages' },
        { status: listRes.status }
      );
    }

    const messageList = listData.messages || [];

    // Fetch details for each message in parallel
    const detailedEmails = await Promise.all(
      messageList.map(async (msg: { id: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const detail = await detailRes.json();

          const headers = detail.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: { name: string; value: string }) =>
              h.name.toLowerCase() === name.toLowerCase()
            )?.value || '';

          const from = getHeader('From');
          const subject = getHeader('Subject') || '(No Subject)';
          const date = getHeader('Date');
          const snippet = detail.snippet || '';

          // Parse sender name and email
          const fromMatch = from.match(/^(?:"?([^"<]*)"?\s*)?(?:<(.+)>)?$/);
          const fromName = (fromMatch?.[1] || '').trim() || fromMatch?.[2] || from;
          const fromEmail = fromMatch?.[2] || from;

          return {
            id: detail.id,
            threadId: detail.threadId,
            fromName: fromName || fromEmail,
            fromEmail,
            subject,
            snippet,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            isRead: !detail.labelIds?.includes('UNREAD'),
            isStarred: detail.labelIds?.includes('STARRED'),
          };
        } catch (e) {
          console.error('[API Emails] Detail fetch error for', msg.id, e);
          return null;
        }
      })
    );

    const validEmails = detailedEmails.filter(Boolean);
    return NextResponse.json({ emails: validEmails, count: validEmails.length });
  } catch (err: any) {
    console.error('[API Emails] Exception:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
