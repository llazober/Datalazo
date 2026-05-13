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
    const text = formData.get('text') as string;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 401 });
    }

    // --- NEW: UNIFIED FAST MODE ---
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
          { role: "system", content: "You are the Datalazo AI Voice Agent. Be concise, professional, and helpful. Keep responses short and suitable for voice conversation (1-3 sentences max)." },
          { role: "user", content: userText }
        ],
      });

      const aiReply = chatCompletion.choices[0].message.content || "I'm sorry, I couldn't process that.";

      // 3. Text to Speech (TTS-1)
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: aiReply,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      
      // Return both the audio and the text in headers (or just the audio)
      return new NextResponse(buffer, {
        headers: { 
          'Content-Type': 'audio/mpeg',
          'X-AI-Transcript': encodeURIComponent(userText),
          'X-AI-Reply': encodeURIComponent(aiReply)
        },
      });
    }

    // --- LEGACY MODES (Keep for compatibility) ---
    if (mode === 'stt' && file) {
      const transcription = await openai.audio.transcriptions.create({
        file: new File([file], 'audio.webm', { type: 'audio/webm' }),
        model: "whisper-1",
      });
      return NextResponse.json({ text: transcription.text });
    } else if (mode === 'tts' && text) {
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
