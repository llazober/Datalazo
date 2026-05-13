# 🎙️ Datalazo Voice Agent Documentation

This document explains the architecture, security, and maintenance of the AI Voice Agent integrated into Datalazo.net.

---

## 🏗️ Architecture (The "Fast Mode" Stack)

The agent uses a unified "Fast Mode" to minimize latency:
1.  **Frontend (React)**: Uses the `MediaRecorder API` to capture raw audio chunks.
2.  **Transcription (OpenAI Whisper)**: Converts the audio file into text.
3.  **Brain (GPT-4o-mini)**: Processes the text and generates a concise response.
4.  **Voice (OpenAI TTS-1)**: Converts the AI text back into a high-quality voice stream (Alloy voice).

---

## 🛡️ Security & Abuse Protection

To prevent excessive API costs and malicious usage, we have implemented two layers:
-   **Recording Timeout**: The microphone automatically stops after **60 seconds** of continuous recording.
-   **Rate Limiting**: Limits each IP address to **10 requests per minute**. 
    -   *Where to change*: `src/app/api/voice/route.ts` -> `limit` variable.

---

## 💰 Cost Management

Current estimated cost: **$0.005 per interaction.**
-   **STT**: $0.006 / min
-   **LLM**: $0.15 / 1M tokens
-   **TTS**: $15.00 / 1M chars

---

## ⚙️ How to Customize

### Change the AI Personality
Edit the `system` message in `src/app/api/voice/route.ts`:
```typescript
{ role: "system", content: "Your new instructions here..." }
```

### Change the Voice
OpenAI offers several voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, and `shimmer`.
Edit the `voice` parameter in `src/app/api/voice/route.ts`.

---

## 🚀 Upgrade Path (Scaling for 1,000+ Users)

If your agency grows and you need even more speed or robustness:

1.  **Deepgram (STT)**: Switch from Whisper to Deepgram for < 300ms transcription.
2.  **Groq (LLM)**: Switch from OpenAI to Groq (Llama 3) for near-instant "thinking" time.
3.  **Upstash Redis (Rate Limiting)**: If you scale to multiple servers, move the `rateLimitMap` to Upstash Redis so the limit is shared across all instances.
4.  **Vapi / Bland AI**: If you want to move from "Web Voice" to "Phone Call Voice" (telephony), these are the best API providers to integrate.

---
*Last Updated: May 2026*
