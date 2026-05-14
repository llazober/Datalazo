import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const keywords = await prisma.keyword.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(keywords);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { term } = await req.json();
    
    // Simulate finding SEO data for this keyword
    const volume = Math.floor(Math.random() * 5000) + 100;
    const difficulty = Math.floor(Math.random() * 100);
    const currentRank = Math.floor(Math.random() * 100) + 1;

    const keyword = await prisma.keyword.create({
      data: {
        term,
        volume,
        difficulty,
        currentRank,
        status: 'TRACKING'
      }
    });

    return NextResponse.json(keyword);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create keyword' }, { status: 500 });
  }
}
