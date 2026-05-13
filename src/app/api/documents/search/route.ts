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
    // (Note: In a large database, this would be slow without pgvector, 
    // but for an agency KB it is fine)
    const chunks = await prisma.documentChunk.findMany({
      include: { document: true }
    });

    // 3. Manual Cosine Similarity
    const similarity = (vecA: number[], vecB: number[]) => {
      const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
      const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
      const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
      return dotProduct / (magA * magB);
    };

    const results = chunks
      .map(chunk => ({
        ...chunk,
        score: similarity(queryEmbedding, chunk.embedding as unknown as number[])
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Return top 5 results

    return NextResponse.json({ 
      success: true, 
      results: results.map(r => ({
        content: r.content,
        documentName: r.document.name,
        score: r.score
      }))
    });
  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json({ 
      error: 'Failed to search knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
