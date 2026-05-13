import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const mode = formData.get('mode') as string; // 'tts' or 'stt'
    const text = formData.get('text') as string;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 401 });
    }

    if (mode === 'stt' && file) {
      // Speech to Text (Whisper)
      const transcription = await openai.audio.transcriptions.create({
        file: new File([file], 'audio.webm', { type: 'audio/webm' }),
        model: "whisper-1",
      });
      return NextResponse.json({ text: transcription.text });
    } else if (mode === 'tts' && text) {
      // Text to Speech
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Voice API Error:', error);
    return NextResponse.json({ error: 'Failed to process voice' }, { status: 500 });
  }
}
