import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { keywordId } = await req.json();

    const keyword = await prisma.keyword.findUnique({
      where: { id: keywordId }
    });

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Generate slug from term
    const slug = keyword.term
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const updatedKeyword = await prisma.keyword.update({
      where: { id: keywordId },
      data: {
        slug,
        isPublic: true,
        status: 'PUBLISHED'
      }
    });

    return NextResponse.json(updatedKeyword);
  } catch (error: any) {
    console.error('Publishing Error:', error);
    return NextResponse.json({ error: 'Failed to publish article' }, { status: 500 });
  }
}
