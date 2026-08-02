import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { searchKnowledge } from '@/lib/knowledge';
import { prisma } from '@/lib/prisma';
import { getDatalazoConfig } from '@/lib/config';
import { getClientIp } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// Simple In-Memory Rate Limiter (Max 15 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

async function getLiveGmailContext(req: Request): Promise<string> {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const matchTokens = cookieHeader.match(new RegExp('(?:^|; )user_tokens=([^;]+)'));
    const matchLegacy = cookieHeader.match(new RegExp('(?:^|; )user_session=([^;]+)'));

    let accessToken: string | null = null;

    if (matchTokens) {
      try {
        const parsed = JSON.parse(decodeURIComponent(matchTokens[1]));
        accessToken = parsed.accessToken || null;
      } catch {}
    }

    if (!accessToken && matchLegacy) {
      try {
        const parsed = JSON.parse(decodeURIComponent(matchLegacy[1]));
        accessToken = parsed.accessToken || null;
      } catch {}
    }

    if (!accessToken) return '';

    // Fetch top 5 messages from Gmail inbox
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=label:INBOX',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) return '';

    const listData = await listRes.json();
    const messageList = listData.messages || [];

    if (messageList.length === 0) return 'Gmail Inbox: Empty (No emails found).';

    const emailDetails = await Promise.all(
      messageList.map(async (msg: { id: string }, idx: number) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          const from = getHeader('From');
          const subject = getHeader('Subject') || '(No Subject)';
          const date = getHeader('Date');
          const snippet = detail.snippet || '';

          return `Email #${idx + 1}:\n- From: ${from}\n- Subject: ${subject}\n- Date: ${date}\n- Snippet: ${snippet}`;
        } catch {
          return null;
        }
      })
    );

    const validEmails = emailDetails.filter(Boolean);
    if (validEmails.length === 0) return '';

    return `LIVE GMAIL INBOX MESSAGES:\n${validEmails.join('\n\n')}`;
  } catch (e) {
    console.error('[Voice Context Error]', e);
    return '';
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
      // Determine extension for OpenAI (Whisper likes correct extensions)
      const mimeType = file.type;
      let extension = 'webm';
      if (mimeType.includes('mp4')) extension = 'mp4';
      else if (mimeType.includes('wav')) extension = 'wav';
      else if (mimeType.includes('mpeg')) extension = 'mp3';

      // 1. Transcription (Whisper)
      const transcription = await openai.audio.transcriptions.create({
        file: new File([file], `audio.${extension}`, { type: mimeType }),
        model: 'whisper-1',
      });

      const userText = transcription.text;

      // 2. Retrieve Live Gmail context & RAG knowledge
      const gmailContext = await getLiveGmailContext(req);
      const knowledge = await searchKnowledge(userText);
      const knowledgePrompt = knowledge ? `\n\nKNOWLEDGE BASE INFO:\n${knowledge}` : '';
      const emailPromptContext = gmailContext ? `\n\n${gmailContext}` : '\n\nNote: User is not connected to Gmail or has no inbox messages.';

      const config = getDatalazoConfig();
      const chosenModel = config.models?.voiceChat || 'gpt-4o-mini';

      // 3. Chat Processing with GPT-4o
      const systemPrompt = `You are Datalazo AI Executive Assistant. Speak in a natural, professional tone. Keep your responses concise (1-3 sentences maximum) suitable for speech output. Answer the user's request directly using their live Gmail emails or knowledge base when asked.${emailPromptContext}${knowledgePrompt}`;

      const chatCompletion = await openai.chat.completions.create({
        model: chosenModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
        ],
        max_tokens: 200,
      });

      const aiReply = chatCompletion.choices[0].message.content || "I'm sorry, I couldn't process your request.";

      // 3.5 Save Usage Matrix
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

      // 4. Text to Speech (TTS-1) - STREAMING
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: aiReply,
        response_format: 'mp3',
      });

      return new NextResponse(response.body, {
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
