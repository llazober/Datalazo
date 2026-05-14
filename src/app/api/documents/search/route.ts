import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge } from '@/lib/knowledge';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const formatted = await searchKnowledge(query);

    return NextResponse.json({ 
      success: true, 
      query_received: query,
      formatted: formatted || "No relevant information found in Knowledge Base."
    });
  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json({ 
      error: 'Failed to search knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
