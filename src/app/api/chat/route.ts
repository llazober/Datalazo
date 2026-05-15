import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { searchKnowledge } from '@/lib/knowledge';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // Search Knowledge Base
    const knowledge = await searchKnowledge(message);
    const knowledgePrompt = knowledge 
      ? `\n\nKNOWLEDGE BASE INFORMATION:\n${knowledge}\n\nUse this information to answer if applicable.`
      : "";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        reply: "AI Chat is in demo mode. Please configure your OPENAI_API_KEY in the .env file to enable real conversations." 
      });
    }

    const safeHistory = Array.isArray(history) ? history : [];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `You are the Datalazo AI Intelligence Agent. Your mission is to represent Datalazo, a premium AI Automation Agency.
          
          OUR OFFICIAL 2026 PRICING:
          1. AI Customer Engagement (CRM Automation):
             - Basic Setup: $1,499 (One-time)
             - Advanced CRM Integration (n8n + AI): $2,999
             - Monthly Maintenance: $499/mo
          
          2. AI Voice Agents (Low-Latency):
             - Single Voice Agent Setup: $999
             - Multi-Language Voice Matrix: $2,499
             - Usage: $0.15 per minute
          
          3. Corporate Knowledge Base (Digital Brain):
             - Implementation: $1,200
             - Vectorization (100 PDFs): $500
             - AI Training & Audit: $750
          
          4. AI Customer Service Agents:
             - Starter Support Bot: $799
             - Advanced 24/7 Agent: $1,799
             - Monthly Managed Service: $299/mo
          
          5. Enterprise Solutions:
             - Custom AI Strategy: Starting at $5,000
             - Dedicated Infrastructure: $1,500/month
          
          Brand Voice:
          - Professional, futuristic, and highly efficient.
          - Use technical terms like "workflows", "integration", and "scalability".
          - Always encourage the user to fill out the "Get Started" form on the page for a custom consultation.
          - Be helpful but concise.${knowledgePrompt}` 
        },
        ...safeHistory,
        { role: "user", content: message }
      ],
    });

    const reply = response.choices[0].message.content;

    // Save Token Usage
    const usage = response.usage;
    if (usage) {
      const estimatedCost = (usage.prompt_tokens * 0.00000015) + (usage.completion_tokens * 0.0000006);
      await prisma.tokenUsage.create({
        data: {
          feature: 'CHAT',
          model: 'gpt-4o-mini',
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          estimatedCost: estimatedCost
        }
      });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
