import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { refreshGoogleAccessToken } from '@/lib/google-auth';

export type EmailCategory =
  | 'Customer'
  | 'Vendor'
  | 'Accounting'
  | 'Banking'
  | 'Personal'
  | 'Internal'
  | 'Marketing'
  | 'Newsletter'
  | 'Spam'
  | 'Unknown';

export type EmailPriority = 'Critical' | 'High' | 'Medium' | 'Low';

interface CategorizedEmail {
  category: EmailCategory;
  priority: EmailPriority;
  summary: string;
}

// Fast heuristic categorizer + OpenAI fallback
function classifyEmailHeuristic(from: string, subject: string, snippet: string): CategorizedEmail | null {
  const text = `${from} ${subject} ${snippet}`.toLowerCase();

  // Banking
  if (
    text.includes('stripe') ||
    text.includes('bank') ||
    text.includes('transfer') ||
    text.includes('chase') ||
    text.includes('paypal') ||
    text.includes('wire transfer')
  ) {
    return {
      category: 'Banking',
      priority: text.includes('failed') || text.includes('alert') || text.includes('dispute') ? 'Critical' : 'High',
      summary: `Banking alert from ${from}: ${subject}`,
    };
  }

  // Accounting / Billing
  if (
    text.includes('invoice') ||
    text.includes('receipt') ||
    text.includes('payment received') ||
    text.includes('billing') ||
    text.includes('tax') ||
    text.includes('statement')
  ) {
    return {
      category: 'Accounting',
      priority: text.includes('overdue') || text.includes('failed') ? 'Critical' : 'High',
      summary: `Accounting/Billing document from ${from}: ${subject}`,
    };
  }

  // Newsletter
  if (
    text.includes('unsubscribe') ||
    text.includes('newsletter') ||
    text.includes('digest') ||
    text.includes('weekly issue') ||
    text.includes('substack')
  ) {
    return {
      category: 'Newsletter',
      priority: 'Low',
      summary: `Newsletter update: ${subject}`,
    };
  }

  // Marketing / Spam
  if (
    text.includes('buy now') ||
    text.includes('limited offer') ||
    text.includes('discount') ||
    text.includes('promo') ||
    text.includes('webinar')
  ) {
    return {
      category: 'Marketing',
      priority: 'Low',
      summary: `Promotional email from ${from}`,
    };
  }

  return null;
}

async function analyzeEmailsBatch(
  emails: { id: string; from: string; subject: string; snippet: string }[]
): Promise<Map<string, CategorizedEmail>> {
  const results = new Map<string, CategorizedEmail>();

  // Check heuristics first
  const unclassified: { id: string; from: string; subject: string; snippet: string }[] = [];
  for (const e of emails) {
    const heur = classifyEmailHeuristic(e.from, e.subject, e.snippet);
    if (heur) {
      results.set(e.id, heur);
    } else {
      unclassified.push(e);
    }
  }

  if (unclassified.length === 0 || !process.env.OPENAI_API_KEY) {
    // Fill remaining with default
    for (const e of unclassified) {
      results.set(e.id, {
        category: 'Customer',
        priority: 'Medium',
        summary: `Email from ${e.from}: ${e.subject}`,
      });
    }
    return results;
  }

  // Batch OpenAI classification for accuracy
  try {
    const promptList = unclassified.map(
      (e, idx) => `[${idx + 1}] ID: ${e.id}\nFrom: ${e.from}\nSubject: ${e.subject}\nSnippet: ${e.snippet.substring(0, 200)}`
    ).join('\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an executive email categorization AI. Analyze the list of emails and return a JSON object containing a "results" array.
For each email, classify into:
- category: one of ["Customer", "Vendor", "Accounting", "Banking", "Personal", "Internal", "Marketing", "Newsletter", "Spam", "Unknown"]
- priority: one of ["Critical", "High", "Medium", "Low"]
- summary: concise 1-sentence executive summary

Return format:
{
  "results": [
    { "id": "msg_id", "category": "Customer", "priority": "High", "summary": "Short summary text" }
  ]
}`,
        },
        { role: 'user', content: promptList },
      ],
      max_tokens: 800,
    });

    const content = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);
    const list: any[] = parsed.results || [];

    for (const item of list) {
      if (item.id && item.category) {
        results.set(item.id, {
          category: item.category as EmailCategory,
          priority: item.priority || 'Medium',
          summary: item.summary || 'Email update',
        });
      }
    }

    // Fallback for any unmapped
    for (const e of unclassified) {
      if (!results.has(e.id)) {
        results.set(e.id, {
          category: 'Customer',
          priority: 'Medium',
          summary: `Email from ${e.from}: ${e.subject}`,
        });
      }
    }
  } catch (err) {
    console.error('[API Emails Categorization Error]', err);
    for (const e of unclassified) {
      results.set(e.id, {
        category: 'Customer',
        priority: 'Medium',
        summary: `Email from ${e.from}: ${e.subject}`,
      });
    }
  }

  return results;
}

export async function GET(req: NextRequest) {
  const tokensCookie = req.cookies.get('user_tokens');
  const legacyCookie = req.cookies.get('user_session');

  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  if (tokensCookie?.value) {
    try {
      const tokens = JSON.parse(tokensCookie.value);
      accessToken = tokens.accessToken || null;
      refreshToken = tokens.refreshToken || null;
    } catch {}
  }

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

  let newTokensCookieVal: string | null = null;

  try {
    // List latest 15 messages from Gmail inbox
    let listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=label:INBOX',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // If access token expired (401), try refreshing using refresh token automatically
    if (listRes.status === 401 && refreshToken) {
      const renewed = await refreshGoogleAccessToken(refreshToken);
      if (renewed?.accessToken) {
        accessToken = renewed.accessToken;
        refreshToken = renewed.refreshToken || refreshToken;
        newTokensCookieVal = JSON.stringify({ accessToken, refreshToken });

        // Retry Gmail API call with new access token
        listRes = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=label:INBOX',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }
    }

    const listData = await listRes.json();

    if (!listRes.ok) {
      console.error('[API Emails] Gmail list error:', listData);
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

    // Fetch details for each message
    const rawEmails = await Promise.all(
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
        } catch {
          return null;
        }
      })
    );

    const validEmails = rawEmails.filter(Boolean) as {
      id: string;
      threadId: string;
      fromName: string;
      fromEmail: string;
      subject: string;
      snippet: string;
      date: string;
      isRead: boolean;
      isStarred: boolean;
    }[];

    // Run batch AI Categorization & Priority Analysis
    const categoryMap = await analyzeEmailsBatch(
      validEmails.map((e) => ({
        id: e.id,
        from: `${e.fromName} <${e.fromEmail}>`,
        subject: e.subject,
        snippet: e.snippet,
      }))
    );

    const categorizedEmails = validEmails.map((e) => {
      const catInfo = categoryMap.get(e.id) || {
        category: 'Customer' as EmailCategory,
        priority: 'Medium' as EmailPriority,
        summary: `Email from ${e.fromName}: ${e.subject}`,
      };

      return {
        ...e,
        aiCategory: catInfo.category,
        aiPriority: catInfo.priority,
        aiSummary: catInfo.summary,
      };
    });

    const res = NextResponse.json({ emails: categorizedEmails, count: categorizedEmails.length });
    if (newTokensCookieVal) {
      res.cookies.set('user_tokens', newTokensCookieVal, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 3600,
      });
    }
    return res;
  } catch (err: any) {
    console.error('[API Emails] Exception:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
