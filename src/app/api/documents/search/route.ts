import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // 1. Embed the query
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    // 2. Fetch all chunks from the database
    const chunks = await prisma.documentChunk.findMany({
      include: { document: true }
    });

    console.log(`Searching through ${chunks.length} chunks...`);

    // 3. Manual Cosine Similarity with safety checks
    const similarity = (vecA: any, vecB: any) => {
      if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
      const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
      const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
      const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
      if (magA === 0 || magB === 0) return 0;
      return dotProduct / (magA * magB);
    };

    const results = chunks
      .map(chunk => {
        const chunkEmbedding = Array.isArray(chunk.embedding) ? chunk.embedding : [];
        const score = similarity(queryEmbedding, chunkEmbedding);
        
        // Safety Net: Keyword match
        const queryWords = query.toLowerCase().split(' ');
        const matchesWords = queryWords.some((word: string) => word.length > 3 && chunk.content.toLowerCase().includes(word));
        
        return {
          ...chunk,
          score: matchesWords ? Math.max(score, 0.6) : score 
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .filter(r => r.score > 0.2); // Only return decent matches

    return NextResponse.json({ 
      success: true, 
      query_received: query,
      chunks_searched: chunks.length,
      top_score: results[0]?.score || 0,
      formatted: results.length > 0 
        ? results.map(r => `[From ${r.document.name}]: ${r.content}`).join('\n\n---\n\n')
        : "No relevant information found in Knowledge Base."
    });
  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json({ 
      error: 'Failed to search knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
