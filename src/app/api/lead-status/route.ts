import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let receivedId = 'unknown';
  try {
    const { id, status } = await req.json();
    receivedId = id;

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
    
    // Check if it's a "Record not found" error
    const isNotFound = error instanceof Error && error.message.includes('Record to update not found');
    
    return NextResponse.json({ 
      error: isNotFound ? 'Lead ID not found in database' : 'Failed to update lead',
      id_received: receivedId,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: isNotFound ? 404 : 500 });
  }
}
