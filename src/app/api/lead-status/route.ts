import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    console.log(`Simplified Update: Lead ${id} -> ${status}`);

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, updatedLead });
  } catch (error) {
    console.error('Simplified Update Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
