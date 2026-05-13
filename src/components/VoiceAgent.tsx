"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function VoiceAgent() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    // Initialize Web Speech API once on mount
    if (typeof window !== 'undefined' && !recognitionRef.current) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              transcriptRef.current += event.results[i][0].transcript + ' ';
            }
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          // Only change status to processing if it was already in listening/processing state
          setStatus(current => {
            if (current === 'listening' || current === 'processing') {
              const finalTranscript = transcriptRef.current.trim();
              if (finalTranscript) {
                handleVoiceInput(finalTranscript);
                transcriptRef.current = ''; 
                return 'processing';
              }
            }
            return 'idle';
          });
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          setStatus('idle');
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      // Manual Stop and Process
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatus('processing');
    } else {
      // Start Listening
      if (audioRef.current) {
        audioRef.current.pause();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setStatus('listening');
      } catch (err) {
        console.error('Failed to start recognition', err);
      }
    }
  };

  const handleVoiceInput = async (text: string) => {
    setStatus('processing');
    try {
      // 1. Get LLM Response
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: [] }),
      });
      const chatData = await chatResponse.json();
      
      if (!chatData.reply) throw new Error('No reply from AI');

      // 2. Get TTS Audio
      const voiceResponse = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chatData.reply }),
      });

      if (!voiceResponse.ok) throw new Error('Failed to get voice');

      const blob = await voiceResponse.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onplay = () => {
          setIsSpeaking(true);
          setStatus('speaking');
        };
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          setStatus('idle');
        };
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Voice handling error:', error);
      setStatus('idle');
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-center">
      {/* Tooltip / Status */}
      <div className={`mb-4 px-4 py-2 rounded-full glass text-xs font-medium transition-all duration-300 ${
        status !== 'idle' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        <span className="flex items-center gap-2">
          {status === 'listening' && <><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Click to finish speaking...</>}
          {status === 'processing' && <><div className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" /> Architecting Reply...</>}
          {status === 'speaking' && <><div className="w-1.5 h-1.5 bg-accent-indigo rounded-full animate-pulse" /> AI is Speaking...</>}
        </span>
      </div>

      {/* Main Voice Button */}
      <button
        onClick={toggleListening}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
          status === 'listening' ? 'bg-red-500/20' : 
          status === 'speaking' ? 'bg-accent-indigo/20' : 'bg-white/5 hover:bg-white/10'
        } border border-white/10 group`}
      >
        {/* Glow Effects */}
        {(isListening || isSpeaking) && (
          <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
            isListening ? 'bg-red-500' : 'bg-accent-indigo'
          }`} />
        )}
        <div className={`absolute -inset-1 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity ${
          isListening ? 'bg-red-500' : 'bg-accent-cyan'
        }`} />

        {/* Icons */}
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
