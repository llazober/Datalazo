import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { searchKnowledge } from '@/lib/knowledge';
import { prisma } from '@/lib/prisma';
import { getDatalazoConfig } from '@/lib/config';


export const dynamic = 'force-dynamic';

// Simple In-Memory Rate Limiter (Max 10 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';

    const now = Date.now();
    const limit = 10;
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
        model: "whisper-1",
      });


      const userText = transcription.text;
      const knowledge = await searchKnowledge(userText);
      const knowledgePrompt = knowledge ? `\n\nKNOWLEDGE BASE INFO:\n${knowledge}` : "";

      const config = getDatalazoConfig();
      const chosenModel = config.models?.voiceChat || 'gpt-4o-mini';

      // 2. Chat Processing
      const chatCompletion = await openai.chat.completions.create({
        model: chosenModel,
        messages: [
          { role: "system", content: `You are the Datalazo AI. Be extremely concise. 1-2 short sentences maximum. Use natural spoken language.${knowledgePrompt}` },
          { role: "user", content: userText }
        ],
        max_tokens: 150,
      });

      const aiReply = chatCompletion.choices[0].message.content || "I'm sorry.";

      // 2.5 Save Usage Matrix
      const usage = chatCompletion.usage;
      if (usage) {
        // Base cost for GPT-4o-mini + flat estimate for Whisper/TTS ($0.005 base)
        const estimatedCost = (usage.prompt_tokens * 0.00000015) + (usage.completion_tokens * 0.0000006) + 0.005;
        
        await prisma.tokenUsage.create({
          data: {
            feature: 'VOICE_AGENT',
            model: `${chosenModel} + tts-1`,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            estimatedCost: estimatedCost
          }
        });
      }

      // 3. Text to Speech (TTS-1) - STREAMING

      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: aiReply,
        response_format: "mp3",
      });

      // Instead of arrayBuffer(), we use the body as a stream
      return new NextResponse(response.body, {
        headers: { 
          'Content-Type': 'audio/mpeg',
          'X-AI-Transcript': encodeURIComponent(userText),
          'X-AI-Reply': encodeURIComponent(aiReply)
        },
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Voice API Error:', error);
    return NextResponse.json({ error: 'Failed to process voice' }, { status: 500 });
  }
}
