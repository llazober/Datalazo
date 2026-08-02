import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { searchKnowledge } from '@/lib/knowledge';
import { prisma } from '@/lib/prisma';
import { getDatalazoConfig } from '@/lib/config';
import { getClientIp } from '@/lib/auth-utils';

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

function getAccessTokenFromReq(req: Request): string | null {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const matchTokens = cookieHeader.match(new RegExp('(?:^|; )user_tokens=([^;]+)'));
    const matchLegacy = cookieHeader.match(new RegExp('(?:^|; )user_session=([^;]+)'));

    if (matchTokens) {
      const parsed = JSON.parse(decodeURIComponent(matchTokens[1]));
      if (parsed?.accessToken) return parsed.accessToken;
    }

    if (matchLegacy) {
      const parsed = JSON.parse(decodeURIComponent(matchLegacy[1]));
      if (parsed?.accessToken) return parsed.accessToken;
    }
  } catch {}
  return null;
}

async function fetchRecentGmailDetails(accessToken: string): Promise<GmailMessageDetail[]> {
  try {
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=label:INBOX',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) return [];

    const listData = await listRes.json();
    const messageList = listData.messages || [];

    const details = await Promise.all(
      messageList.map(async (msg: { id: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
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

    return details.filter(Boolean) as GmailMessageDetail[];
  } catch {
    return [];
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
    
    // Parse target email from "Name <email@domain.com>" or "email@domain.com"
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

      // 1. Whisper Voice Transcription
      const transcription = await openai.audio.transcriptions.create({
        file: new File([file], `audio.${extension}`, { type: mimeType }),
        model: 'whisper-1',
      });

      const userText = transcription.text;

      // 2. Retrieve Live Gmail Inbox Details
      const accessToken = getAccessTokenFromReq(req);
      let gmailMessages: GmailMessageDetail[] = [];
      let emailContextPrompt = 'User is not signed in to Gmail or has no inbox messages.';

      if (accessToken) {
        gmailMessages = await fetchRecentGmailDetails(accessToken);
        if (gmailMessages.length > 0) {
          const listFormatted = gmailMessages.map((m, i) =>
            `Email #${i + 1}:\n- From: ${m.from}\n- Subject: ${m.subject}\n- Date: ${m.date}\n- Snippet: ${m.snippet}`
          );
          emailContextPrompt = `LIVE GMAIL INBOX MESSAGES:\n${listFormatted.join('\n\n')}`;
        }
      }

      const knowledge = await searchKnowledge(userText);
      const knowledgePrompt = knowledge ? `\n\nKNOWLEDGE BASE INFO:\n${knowledge}` : '';

      const config = getDatalazoConfig();
      const chosenModel = config.models?.voiceChat || 'gpt-4o';

      // 3. Define Tools for GPT-4o
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
      ];

      const systemPrompt = `You are Datalazo AI Executive Assistant. Speak in a natural, professional tone. Keep responses concise (1-3 sentences) suitable for voice speech.
Use the live Gmail inbox context below to answer questions or reply to emails.
If the user asks to reply to an email (e.g. "reply saying...", "send a reply to the last email with...", "tell them..."), call the 'send_reply_email' tool with the extracted reply body text.

${emailContextPrompt}${knowledgePrompt}`;

      // 4. Chat Completion with Function Calling
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

      // Handle tool call (sending reply email)
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
                // Parse clean sender name
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
        }
      } else {
        aiReply = responseMessage.content || "I'm sorry, I couldn't process your request.";
      }

      // Track usage
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

      // 5. Generate TTS Audio for the spoken confirmation/response
      const speechResponse = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: aiReply,
        response_format: 'mp3',
      });

      return new NextResponse(speechResponse.body, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-AI-Transcript': encodeURIComponent(userText),
          'X-AI-Reply': encodeURIComponent(aiReply),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Voice API Error:', error);
    return NextResponse.json({ error: 'Failed to process voice' }, { status: 500 });
  }
}
