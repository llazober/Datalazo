import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await req.json();
    const { id } = await params;

    console.log(`Attempting to update lead ${id} to status: ${status}`);

    const leadExists = await prisma.lead.findUnique({ where: { id } });
    
    if (!leadExists) {
      console.error(`Lead with ID ${id} not found in database.`);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    console.log(`Lead ${id} updated successfully!`);
    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('API Error updating lead status:', error);
    return NextResponse.json({ 
      error: 'Failed to update lead status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
