import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { keywordId } = await req.json();

    // 1. Fetch Keyword
    const keyword = await prisma.keyword.findUnique({
      where: { id: keywordId }
    });

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Update status to GENERATING
    await prisma.keyword.update({
      where: { id: keywordId },
      data: { status: 'GENERATING' }
    });

    // 2. Fetch Knowledge Base Context
    const documents = await prisma.document.findMany({
      where: { status: 'READY' },
      take: 5
    });

    const context = documents.map(doc => doc.content).filter(Boolean).join('\n\n');

    // 3. Generate Content with OpenAI
    const prompt = `
      You are the Lead SEO Content Architect for Datalazo Intelligence Agency.
      YOUR MISSION: Write a 1,000-word, high-performance SEO article/landing page for the keyword: "${keyword.term}".

      KNOWLEDGE BASE CONTEXT (Use this for facts and agency personality):
      ${context || "Datalazo is an AI-powered growth agency specializing in Voice Agents, Process Automation, and SEO Matrix systems."}

      STRICT FORMATTING RULES:
      1. Use high-impact HTML tags: <h1>, <h2>, <h3>.
      2. Use <strong> for key terms.
      3. Use <ul> and <li> for features/benefits.
      4. Include a "Meta Description" at the top in a <blockquote>.
      5. Tone: Premium, Authoritative, Future-Focused, and Results-Driven.
      6. Incorporate the keyword "${keyword.term}" naturally throughout the text.
      7. Focus on how Datalazo's AI technology solves real business problems.

      STRUCTURE:
      - H1: Compelling Title with the Keyword.
      - Introduction: The challenge in the current market.
      - H2: The Datalazo Solution.
      - H2: Core Features & Benefits.
      - H3: Technical Infrastructure (Mentioning GPT-4o, n8n, etc if relevant).
      - H2: Conclusion & Call to Action.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a world-class SEO content generator.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    const generatedContent = response.choices[0].message.content;

    // 4. Update Keyword with content
    const updatedKeyword = await prisma.keyword.update({
      where: { id: keywordId },
      data: {
        content: generatedContent,
        status: 'PUBLISHED',
        lastChecked: new Date()
      }
    });

    return NextResponse.json(updatedKeyword);
  } catch (error: any) {
    console.error('Content Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
