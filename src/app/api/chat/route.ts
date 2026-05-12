import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-placeholder-key',
});

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        reply: "AI Chat is in demo mode. Please configure your OPENAI_API_KEY in the .env file to enable real conversations." 
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `You are the Datalazo AI Intelligence Agent. Your mission is to represent Datalazo, a premium AI Automation Agency.
          
          Our Core Services:
          1. Process Automation: We build n8n and Zapier workflows to save businesses 20+ hours a week.
          2. AI Chat Agents: Custom GPT-powered bots for customer support and sales.
          3. SEO Matrix: Advanced automated SEO strategies to dominate search results.
          4. AI Voice Agents: Automated phone systems for booking and support.
          
          Brand Voice:
          - Professional, futuristic, and highly efficient.
          - Use technical terms like "workflows", "integration", and "scalability".
          - Always encourage the user to fill out the "Get Started" form on the page for a custom consultation.
          - Be helpful but concise.` 
        },
        ...history,
        { role: "user", content: message }
      ],
    });

    return NextResponse.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
