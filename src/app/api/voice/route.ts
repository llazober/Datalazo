import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const mode = formData.get('mode') as string;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 401 });
    }

    if (mode === 'fast' && file) {
      // 1. Transcription (Whisper)
      const transcription = await openai.audio.transcriptions.create({
        file: new File([file], 'audio.webm', { type: 'audio/webm' }),
        model: "whisper-1",
      });

      const userText = transcription.text;

      // 2. Chat Processing (GPT-4o-mini)
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are the Datalazo AI. Be extremely concise. 1-2 short sentences maximum. Use natural spoken language." },
          { role: "user", content: userText }
        ],
        max_tokens: 150,
      });

      const aiReply = chatCompletion.choices[0].message.content || "I'm sorry.";

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
