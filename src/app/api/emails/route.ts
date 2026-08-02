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

function sanitizeSearchQuery(input: string): string {
  let q = input.trim();
  if (!q) return '';

  // 1. Remove all common conversational prefixes
  q = q.replace(/^(please\s+|can\s+you\s+|i\s+want\s+to\s+)?(search|find|show\s+me|get|look\s+for)\s+/i, '');
  q = q.replace(/^(emails?\s+|messages?\s+)/i, '');
  q = q.replace(/^(in\s+inbox\s+folder\s+for|in\s+inbox\s+for|from\s+inbox\s+for|in\s+inbox\s+folder|in\s+inbox|from\s+inbox|in\s+folder|folder\s+for|for|from|about)\s+/i, '');
  q = q.replace(/^(inbox\s+folder\s+for|inbox\s+for|folder\s+for|emails?\s+for|emails?\s+from|emails?\s+about)\s+/i, '');
  q = q.replace(/^(for|from|about)\s+/i, '');
  q = q.trim();

  // 2. Remove trailing folder/inbox references (e.g. "Victor in inbox folder")
  q = q.replace(/\s+(in|inside)\s+(the\s+)?(inbox|folder|label).*/i, '');
  q = q.replace(/^(inbox|folder)\s+for\s+/i, '');
  q = q.trim();

  return q;
}

export async function GET(req: NextRequest) {
  const tokensCookie = req.cookies.get('user_tokens');
  const legacyCookie = req.cookies.get('user_session');
  const searchQueryParam = req.nextUrl.searchParams.get('q') || '';

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

  // Construct Gmail API query string with conversational query sanitizer
  let gmailQuery = 'label:INBOX';
  if (searchQueryParam.trim()) {
    const cleaned = sanitizeSearchQuery(searchQueryParam);
    if (cleaned.toLowerCase().startsWith('all:') || cleaned.toLowerCase().startsWith('global:')) {
      gmailQuery = cleaned.replace(/^(all|global):/i, '').trim();
    } else if (cleaned.includes('label:') || cleaned.includes('in:') || cleaned.includes('from:') || cleaned.includes('to:') || cleaned.includes('subject:')) {
      gmailQuery = cleaned;
    } else if (cleaned) {
      gmailQuery = `label:INBOX (${cleaned} OR from:"${cleaned}")`;
    }
  }

  try {
    // List latest 15 messages matching query
    let listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=${encodeURIComponent(gmailQuery)}`,
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
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=${encodeURIComponent(gmailQuery)}`,
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

export async function POST(req: NextRequest) {
  const tokensCookie = req.cookies.get('user_tokens');
  let accessToken: string | null = null;

  if (tokensCookie?.value) {
    try {
      const tokens = JSON.parse(tokensCookie.value);
      accessToken = tokens.accessToken || null;
    } catch {}
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, messageIds, folderName } = body as {
      action: 'move' | 'archive' | 'trash' | 'restore';
      messageIds: string[];
      folderName?: string;
    };

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'No messageIds provided' }, { status: 400 });
    }

    let addLabelIds: string[] = [];
    let removeLabelIds: string[] = [];

    if (action === 'archive') {
      removeLabelIds = ['INBOX'];
    } else if (action === 'trash') {
      addLabelIds = ['TRASH'];
    } else if (action === 'restore') {
      addLabelIds = ['INBOX'];
      removeLabelIds = ['TRASH'];
    } else if (action === 'move') {
      if (!folderName) {
        return NextResponse.json({ error: 'folderName required for move' }, { status: 400 });
      }

      // Check/create folder label
      const labelsRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      let targetLabelId: string | null = null;
      if (labelsRes.ok) {
        const labelsData = await labelsRes.json();
        const existing = (labelsData.labels || []).find(
          (l: { id: string; name: string }) => l.name.toLowerCase() === folderName.toLowerCase()
        );
        if (existing) targetLabelId = existing.id;
      }

      if (!targetLabelId) {
        const createRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: folderName,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show',
          }),
        });

        if (createRes.ok) {
          const newLabel = await createRes.json();
          targetLabelId = newLabel.id;
        }
      }

      if (!targetLabelId) {
        return NextResponse.json({ error: `Could not find or create folder "${folderName}"` }, { status: 400 });
      }

      addLabelIds = [targetLabelId];
      removeLabelIds = ['INBOX'];
    }

    const batchRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: messageIds,
        addLabelIds,
        removeLabelIds,
      }),
    });

    if (!batchRes.ok) {
      const errData = await batchRes.json();
      return NextResponse.json({ error: errData.error?.message || 'Batch operation failed' }, { status: batchRes.status });
    }

    return NextResponse.json({ success: true, count: messageIds.length, action });
  } catch (err: any) {
    console.error('[API Emails Batch] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
