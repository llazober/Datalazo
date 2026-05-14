import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { keywordId } = await req.json();

    const updatedKeyword = await prisma.keyword.update({
      where: { id: keywordId },
      data: {
        isPublic: false,
        status: 'TRACKING'
      }
    });

    return NextResponse.json(updatedKeyword);
  } catch (error: any) {
    console.error('Unpublishing Error:', error);
    return NextResponse.json({ error: 'Failed to unpublish article' }, { status: 500 });
  }
}
