import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { searchKnowledge } from '@/lib/knowledge';
import { prisma } from '@/lib/prisma';
import { getDatalazoConfig } from '@/lib/config';
import { getClientIp } from '@/lib/auth-utils';
import { refreshGoogleAccessToken } from '@/lib/google-auth';

export const dynamic = 'force-dynamic';

// Simple In-Memory Rate Limiter (Max 15 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

interface GmailMessageDetail {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  messageIdHeader?: string;
}

function getTokensFromReq(req: Request): { accessToken: string | null; refreshToken: string | null } {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const matchTokens = cookieHeader.match(new RegExp('(?:^|; )user_tokens=([^;]+)'));
    const matchLegacy = cookieHeader.match(new RegExp('(?:^|; )user_session=([^;]+)'));

    if (matchTokens) {
      const parsed = JSON.parse(decodeURIComponent(matchTokens[1]));
      return {
        accessToken: parsed?.accessToken || null,
        refreshToken: parsed?.refreshToken || null,
      };
    }

    if (matchLegacy) {
      const parsed = JSON.parse(decodeURIComponent(matchLegacy[1]));
      return {
        accessToken: parsed?.accessToken || null,
        refreshToken: null,
      };
    }
  } catch {}
  return { accessToken: null, refreshToken: null };
}

function getAccessTokenFromReq(req: Request): string | null {
  return getTokensFromReq(req).accessToken;
}

async function fetchRecentGmailDetails(
  accessToken: string,
  selectedId?: string | null,
  refreshToken?: string | null
): Promise<{ details: GmailMessageDetail[]; newTokens?: string }> {
  try {
    let activeToken = accessToken;
    let newTokensCookie: string | undefined;

    let listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8&q=label:INBOX',
      { headers: { Authorization: `Bearer ${activeToken}` } }
    );

    if (listRes.status === 401 && refreshToken) {
      const renewed = await refreshGoogleAccessToken(refreshToken);
      if (renewed?.accessToken) {
        activeToken = renewed.accessToken;
        newTokensCookie = JSON.stringify({ accessToken: activeToken, refreshToken: renewed.refreshToken || refreshToken });
        listRes = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8&q=label:INBOX',
          { headers: { Authorization: `Bearer ${activeToken}` } }
        );
      }
    }

    if (!listRes.ok) return { details: [] };

    const listData = await listRes.json();
    let messageList: { id: string }[] = listData.messages || [];

    if (selectedId) {
      messageList = [
        { id: selectedId },
        ...messageList.filter((m) => m.id !== selectedId),
      ];
    }

    const details = await Promise.all(
      messageList.slice(0, 5).map(async (msg: { id: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${activeToken}` } }
          );
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          return {
            id: detail.id,
            threadId: detail.threadId,
            from: getHeader('From'),
            subject: getHeader('Subject') || '(No Subject)',
            date: getHeader('Date'),
            snippet: detail.snippet || '',
            messageIdHeader: getHeader('Message-ID'),
          };
        } catch {
          return null;
        }
      })
    );

    return { details: details.filter(Boolean) as GmailMessageDetail[], newTokens: newTokensCookie };
  } catch {
    return { details: [] };
  }
}

async function sendGmailReply(
  accessToken: string,
  toEmail: string,
  subject: string,
  threadId: string,
  inReplyToMsgId: string,
  replyBody: string
): Promise<boolean> {
  try {
    const cleanSubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
    
    const fromMatch = toEmail.match(/^(?:"?([^"<]*)"?\s*)?(?:<(.+)>)?$/);
    const recipient = fromMatch?.[2] || fromMatch?.[1] || toEmail;

    const emailLines = [
      `To: ${recipient}`,
      `Subject: ${cleanSubject}`,
    ];

    if (inReplyToMsgId) {
      emailLines.push(`In-Reply-To: ${inReplyToMsgId}`);
      emailLines.push(`References: ${inReplyToMsgId}`);
    }

    emailLines.push(`Content-Type: text/plain; charset=utf-8`);
    emailLines.push(``);
    emailLines.push(replyBody);

    const rawEmail = emailLines.join('\r\n');

    const base64Encoded = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64Encoded,
        threadId: threadId,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('[Send Gmail Reply Error]', err);
    return false;
  }
}

async function trashGmailMessage(accessToken: string, messageId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch (err) {
    console.error('[Trash Gmail Error]', err);
    return false;
  }
}

async function archiveGmailMessage(accessToken: string, messageId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removeLabelIds: ['INBOX'],
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Archive Gmail Error]', err);
    return false;
  }
}

async function moveGmailMessageToFolder(
  accessToken: string,
  messageId: string,
  folderName: string
): Promise<{ success: boolean; labelName: string }> {
  try {
    const labelsRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let targetLabelId: string | null = null;
    let finalLabelName = folderName;

    if (labelsRes.ok) {
      const labelsData = await labelsRes.json();
      const existing = (labelsData.labels || []).find(
        (l: { id: string; name: string }) => l.name.toLowerCase() === folderName.toLowerCase()
      );
      if (existing) {
        targetLabelId = existing.id;
        finalLabelName = existing.name;
      }
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
        finalLabelName = newLabel.name;
      }
    }

    if (!targetLabelId) return { success: false, labelName: folderName };

    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addLabelIds: [targetLabelId],
        removeLabelIds: ['INBOX'],
      }),
    });

    return { success: res.ok, labelName: finalLabelName };
  } catch (err) {
    console.error('[Move Gmail Message Error]', err);
    return { success: false, labelName: folderName };
  }
}

async function scheduleGoogleCalendarEvent(
  accessToken: string,
  summary: string,
  startIso: string,
  endIso: string,
  attendeeEmail?: string
): Promise<{ success: boolean; isConflict?: boolean; link?: string; formattedStart?: string }> {
  try {
    const freeBusyRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: startIso,
        timeMax: endIso,
        items: [{ id: 'primary' }],
      }),
    });

    if (freeBusyRes.ok) {
      const freeBusyData = await freeBusyRes.json();
      const busyList = freeBusyData.calendars?.primary?.busy || [];
      if (busyList.length > 0) {
        return { success: false, isConflict: true };
      }
    }

    const eventBody: any = {
      summary: summary || 'Executive Meeting',
      description: 'Scheduled via Datalazo AI Executive Assistant',
      start: { dateTime: startIso },
      end: { dateTime: endIso },
    };

    if (attendeeEmail) {
      eventBody.attendees = [{ email: attendeeEmail }];
    }

    const eventRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (eventRes.ok) {
      const eventData = await eventRes.json();
      const startDate = new Date(startIso);
      const formattedStart = startDate.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return { success: true, link: eventData.htmlLink, formattedStart };
    }

    return { success: false };
  } catch (err) {
    console.error('[Google Calendar Schedule Error]', err);
    return { success: false };
  }
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const now = Date.now();
    const limit = 15;
    const windowMs = 60000;

    const currentLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - currentLimit.lastReset > windowMs) {
      currentLimit.count = 0;
      currentLimit.lastReset = now;
    }

    if (currentLimit.count >= limit) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    currentLimit.count++;
    rateLimitMap.set(ip, currentLimit);

    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const mode = formData.get('mode') as string;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 401 });
    }

    if (mode === 'fast' && file) {
      const mimeType = file.type;
      let extension = 'webm';
      if (mimeType.includes('mp4')) extension = 'mp4';
      else if (mimeType.includes('wav')) extension = 'wav';
      else if (mimeType.includes('mpeg')) extension = 'mp3';

      const transcription = await openai.audio.transcriptions.create({
        file: new File([file], `audio.${extension}`, { type: mimeType }),
        model: 'whisper-1',
      });

      const userText = transcription.text;

      // 2. Retrieve Live Gmail Inbox Details
      const { accessToken, refreshToken } = getTokensFromReq(req);
      const selectedId = req.headers.get('x-selected-email-id') || null;
      let gmailMessages: GmailMessageDetail[] = [];
      let emailContextPrompt = 'User is not signed in to Gmail or has no inbox messages.';
      let newTokensCookieVal: string | undefined;

      if (accessToken) {
        const result = await fetchRecentGmailDetails(accessToken, selectedId, refreshToken);
        gmailMessages = result.details;
        newTokensCookieVal = result.newTokens;
        if (gmailMessages.length > 0) {
          const listFormatted = gmailMessages.map((m, i) =>
            `Email #${i + 1}${selectedId && i === 0 ? ' [SELECTED BY USER IN UI]' : ''}:\n- From: ${m.from}\n- Subject: ${m.subject}\n- Date: ${m.date}\n- Snippet: ${m.snippet}`
          );
          emailContextPrompt = `LIVE GMAIL INBOX MESSAGES:\n${listFormatted.join('\n\n')}`;
        }
      }

      const knowledge = await searchKnowledge(userText);
      const knowledgePrompt = knowledge ? `\n\nKNOWLEDGE BASE INFO:\n${knowledge}` : '';

      const config = getDatalazoConfig();
      const chosenModel = config.models?.voiceChat || 'gpt-4o';

      const currentIsoDate = new Date().toISOString();

      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'send_reply_email',
            description: 'Send a reply email to an existing Gmail message in the user inbox.',
            parameters: {
              type: 'object',
              properties: {
                emailIndex: {
                  type: 'integer',
                  description: '1-based index of the email in the inbox list to reply to (default 1 for latest).',
                },
                replyBody: {
                  type: 'string',
                  description: 'The exact text message body to send in the reply email.',
                },
              },
              required: ['replyBody'],
            },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'trash_email',
            description: 'Move an email message to Trash (Delete to Trash).',
            parameters: {
              type: 'object',
              properties: {
                emailIndex: {
                  type: 'integer',
                  description: '1-based index of the email in the inbox list to move to Trash (default 1 for latest).',
                },
              },
            },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'archive_email',
            description: 'Archive an email message (remove from Inbox).',
            parameters: {
              type: 'object',
              properties: {
                emailIndex: {
                  type: 'integer',
                  description: '1-based index of the email in the inbox list to archive (default 1 for latest).',
                },
              },
            },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'move_email_to_folder',
            description: 'Move an email to a specific folder or label (e.g. "Work", "Finance", "Personal", "Receipts", etc.). Creates the folder if it does not exist.',
            parameters: {
              type: 'object',
              properties: {
                emailIndex: {
                  type: 'integer',
                  description: '1-based index of the email in the inbox list to move (default 1 for latest).',
                },
                folderName: {
                  type: 'string',
                  description: 'The target folder or label name specified by the user (e.g. "Finance", "Work", "Personal").',
                },
              },
              required: ['folderName'],
            },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'schedule_calendar_event',
            description: 'Check availability and schedule a meeting/event on Google Calendar.',
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: 'Meeting title or subject (e.g., "Project Review with John").',
                },
                startIso: {
                  type: 'string',
                  description: `Start date/time in ISO 8601 format with timezone offset. Current ISO date: ${currentIsoDate}`,
                },
                endIso: {
                  type: 'string',
                  description: `End date/time in ISO 8601 format (default 30 mins after startIso). Current ISO date: ${currentIsoDate}`,
                },
                attendeeEmail: {
                  type: 'string',
                  description: 'Optional email address of meeting attendee to invite.',
                },
              },
              required: ['summary', 'startIso', 'endIso'],
            },
          },
        },
      ];

      const systemPrompt = `You are Datalazo AI Executive Assistant. Speak in a natural, professional tone. Keep responses concise (1-3 sentences) suitable for voice speech. Current date/time is ${currentIsoDate}.
LANGUAGE MANDATE: You MUST respond in the EXACT SAME LANGUAGE as the user's input or the email being discussed. If the user speaks in Spanish, asks in Spanish, or if the email is in Spanish, YOU MUST RESPOND IN FLUENT, NATURAL SPANISH. Do NOT reply in English when spoken to or reading content in Spanish.

Use the live Gmail inbox context below to answer questions, reply to emails, trash/archive emails, move emails to folders, or schedule meetings on Google Calendar.
- If the user asks to reply to an email, call 'send_reply_email'.
- If the user asks to delete/trash an email, call 'trash_email'.
- If the user asks to archive an email, call 'archive_email'.
- If the user asks to move an email to a specific folder or label (e.g. "Move to Work", "Mover a Facturas"), call 'move_email_to_folder'.
- If the user asks to schedule or set up a meeting/event, call 'schedule_calendar_event'.

${emailContextPrompt}${knowledgePrompt}`;

      const chatCompletion = await openai.chat.completions.create({
        model: chosenModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
        ],
        tools: tools,
        tool_choice: 'auto',
        max_tokens: 250,
      });

      let aiReply = '';
      const responseMessage = chatCompletion.choices[0].message;

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];

        if (toolCall.type === 'function' && toolCall.function.name === 'send_reply_email') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const index = (args.emailIndex || 1) - 1;
            const targetMsg = gmailMessages[index] || gmailMessages[0];

            if (accessToken && targetMsg) {
              const success = await sendGmailReply(
                accessToken,
                targetMsg.from,
                targetMsg.subject,
                targetMsg.threadId,
                targetMsg.messageIdHeader || '',
                args.replyBody
              );

              if (success) {
                const senderMatch = targetMsg.from.match(/^(?:"?([^"<]*)"?\s*)?(?:<(.+)>)?$/);
                const senderName = (senderMatch?.[1] || '').trim() || senderMatch?.[2] || targetMsg.from;
                aiReply = `Sent reply to ${senderName} with message: "${args.replyBody}".`;
              } else {
                aiReply = 'Failed to send reply email via Gmail. Please try again.';
              }
            } else {
              aiReply = 'Cannot send reply: Please sign in with Google to enable email sending.';
            }
          } catch (e) {
            console.error('[Tool Call Reply Error]', e);
            aiReply = 'There was an error formatting your reply email.';
          }
        } else if (toolCall.type === 'function' && toolCall.function.name === 'trash_email') {
          try {
            const args = JSON.parse(toolCall.function.arguments || '{}');
            const index = (args.emailIndex || 1) - 1;
            const targetMsg = gmailMessages[index] || gmailMessages[0];

            if (accessToken && targetMsg) {
              const ok = await trashGmailMessage(accessToken, targetMsg.id);
              if (ok) {
                aiReply = `Moved email from ${targetMsg.from} to Trash.`;
              } else {
                aiReply = 'Failed to move email to Trash.';
              }
            } else {
              aiReply = 'Cannot trash email: Please sign in with Google first.';
            }
          } catch (e) {
            aiReply = 'There was an error moving the email to Trash.';
          }
        } else if (toolCall.type === 'function' && toolCall.function.name === 'archive_email') {
          try {
            const args = JSON.parse(toolCall.function.arguments || '{}');
            const index = (args.emailIndex || 1) - 1;
            const targetMsg = gmailMessages[index] || gmailMessages[0];

            if (accessToken && targetMsg) {
              const ok = await archiveGmailMessage(accessToken, targetMsg.id);
              if (ok) {
                aiReply = `Archived email from ${targetMsg.from}.`;
              } else {
                aiReply = 'Failed to archive email.';
              }
            } else {
              aiReply = 'Cannot archive email: Please sign in with Google first.';
            }
          } catch (e) {
            aiReply = 'There was an error archiving the email.';
          }
        } else if (toolCall.type === 'function' && toolCall.function.name === 'move_email_to_folder') {
          try {
            const args = JSON.parse(toolCall.function.arguments || '{}');
            const index = (args.emailIndex || 1) - 1;
            const targetMsg = gmailMessages[index] || gmailMessages[0];
            const folderName = args.folderName || 'Folder';

            if (accessToken && targetMsg) {
              const res = await moveGmailMessageToFolder(accessToken, targetMsg.id, folderName);
              if (res.success) {
                const senderMatch = targetMsg.from.match(/^(?:"?([^"<]*)"?\s*)?(?:<(.+)>)?$/);
                const senderName = (senderMatch?.[1] || '').trim() || senderMatch?.[2] || targetMsg.from;
                aiReply = `Moved email from ${senderName} to folder "${res.labelName}".`;
              } else {
                aiReply = `Failed to move email to folder "${folderName}".`;
              }
            } else {
              aiReply = 'Cannot move email: Please sign in with Google first.';
            }
          } catch (e) {
            aiReply = 'There was an error moving the email to the requested folder.';
          }
        } else if (toolCall.type === 'function' && toolCall.function.name === 'schedule_calendar_event') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            if (accessToken) {
              const result = await scheduleGoogleCalendarEvent(
                accessToken,
                args.summary,
                args.startIso,
                args.endIso,
                args.attendeeEmail
              );

              if (result.success) {
                aiReply = `Successfully scheduled "${args.summary}" on your Google Calendar for ${result.formattedStart || 'the requested time'}.`;
              } else if (result.isConflict) {
                aiReply = `You have a calendar conflict at that time. Would you like to schedule it for a different time?`;
              } else {
                aiReply = `Failed to schedule event on Google Calendar. Please check your Google account connection.`;
              }
            } else {
              aiReply = 'Cannot schedule meeting: Please sign in with Google to access your Google Calendar.';
            }
          } catch (e) {
            console.error('[Tool Call Calendar Error]', e);
            aiReply = 'There was an error scheduling your meeting on Google Calendar.';
          }
        }
      } else {
        aiReply = responseMessage.content || "I'm sorry, I couldn't process your request.";
      }

      const usage = chatCompletion.usage;
      if (usage) {
        const estimatedCost = usage.prompt_tokens * 0.00000015 + usage.completion_tokens * 0.0000006 + 0.005;
        await prisma.tokenUsage.create({
          data: {
            feature: 'VOICE_AGENT',
            model: `${chosenModel} + tts-1`,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            estimatedCost: estimatedCost,
          },
        });
      }

      const speechResponse = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova',
        input: aiReply,
        response_format: 'mp3',
      });

      const res = new NextResponse(speechResponse.body, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-AI-Transcript': encodeURIComponent(userText),
          'X-AI-Reply': encodeURIComponent(aiReply),
        },
      });
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
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Voice API Error:', error);
    return NextResponse.json({ error: 'Failed to process voice' }, { status: 500 });
  }
}
