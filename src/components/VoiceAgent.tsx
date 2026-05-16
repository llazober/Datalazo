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
      
      // Determine supported mime type (iOS fallback)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : 'audio/aac';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const finalMimeType = mediaRecorder.mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        handleVoiceAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      // Start with 1s timeslice for better mobile reliability
      mediaRecorder.start(1000);

      setStatus('listening');

      // 60-second auto-stop to prevent abuse
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 60000); 
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
    // UNLOCK AUDIO FOR iOS: We must play/pause a sound directly in the click handler
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
      }).catch(() => {
        // Silent catch for initial interaction
      });
    }

    if (status === 'listening') {
      stopRecording();
    } else {
      startRecording();
    }
  };


  const handleVoiceAudio = async (blob: Blob) => {
    setStatus('processing');
    try {
      // Unified Fast Mode: Send audio, get back audio + metadata
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('mode', 'fast');

      const response = await fetch('/api/voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process voice in fast mode');

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);

      // Optional: Read transcripts from headers if needed for UI
      // const transcript = decodeURIComponent(response.headers.get('X-AI-Transcript') || '');
      // const reply = decodeURIComponent(response.headers.get('X-AI-Reply') || '');

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
          {status === 'listening' && <><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> [v2] Click to stop recording...</>}
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
