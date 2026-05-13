"use client";

import React, { useState, useRef } from 'react';

export default function VoiceAgent() {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleVoiceAudio(audioBlob);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setStatus('listening');
    } catch (err) {
      console.error('Failed to start recording', err);
      setStatus('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setStatus('processing');
    }
  };

  const toggleListening = () => {
    if (status === 'listening') {
      stopRecording();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      startRecording();
    }
  };

  const handleVoiceAudio = async (blob: Blob) => {
    setStatus('processing');
    try {
      // 1. Transcribe with Whisper
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('mode', 'stt');

      const sttResponse = await fetch('/api/voice', {
        method: 'POST',
        body: formData,
      });
      const sttData = await sttResponse.json();
      
      if (!sttData.text) throw new Error('No transcription result');

      // 2. Get LLM Response
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: sttData.text, history: [] }),
      });
      const chatData = await chatResponse.json();
      
      if (!chatData.reply) throw new Error('No reply from AI');

      // 3. Get TTS Audio
      const ttsFormData = new FormData();
      ttsFormData.append('mode', 'tts');
      ttsFormData.append('text', chatData.reply);

      const ttsResponse = await fetch('/api/voice', {
        method: 'POST',
        body: ttsFormData,
      });

      if (!ttsResponse.ok) throw new Error('Failed to get voice');

      const audioBlob = await ttsResponse.blob();
      const url = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onplay = () => setStatus('speaking');
        audioRef.current.onended = () => setStatus('idle');
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Voice handling error:', error);
      setStatus('idle');
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-center">
      <div className={`mb-4 px-4 py-2 rounded-full glass text-xs font-medium transition-all duration-300 ${
        status !== 'idle' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        <span className="flex items-center gap-2">
          {status === 'listening' && <><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Click to finish...</>}
          {status === 'processing' && <><div className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" /> Transcribing & Thinking...</>}
          {status === 'speaking' && <><div className="w-1.5 h-1.5 bg-accent-indigo rounded-full animate-pulse" /> AI is Speaking...</>}
        </span>
      </div>

      <button
        onClick={toggleListening}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
          status === 'listening' ? 'bg-red-500/20' : 
          status === 'speaking' ? 'bg-accent-indigo/20' : 'bg-white/5 hover:bg-white/10'
        } border border-white/10 group`}
      >
        {(status === 'listening' || status === 'speaking') && (
          <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
            status === 'listening' ? 'bg-red-500' : 'bg-accent-indigo'
          }`} />
        )}
        <div className={`absolute -inset-1 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity ${
          status === 'listening' ? 'bg-red-500' : 'bg-accent-cyan'
        }`} />

        {status === 'listening' ? (
           <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
             <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
             <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
           </svg>
        ) : status === 'speaking' ? (
          <div className="flex gap-1 items-end h-4">
            <div className="w-1 bg-accent-indigo animate-[wave_1s_infinite]" />
            <div className="w-1 bg-accent-indigo animate-[wave_1.2s_infinite_0.1s]" />
            <div className="w-1 bg-accent-indigo animate-[wave_0.8s_infinite_0.2s]" />
            <div className="w-1 bg-accent-indigo animate-[wave_1.1s_infinite_0.3s]" />
          </div>
        ) : (
          <svg className="w-6 h-6 text-slate-300 group-hover:text-accent-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      <audio ref={audioRef} className="hidden" />

      <style jsx>{`
        @keyframes wave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
      `}</style>
    </div>
  );
}
