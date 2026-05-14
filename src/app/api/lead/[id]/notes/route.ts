import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { notes } = await req.json();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { notes },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Lead Notes Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
