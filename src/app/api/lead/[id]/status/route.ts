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

    let leadExists = await prisma.lead.findFirst({ where: { id } });
    
    // Race condition safety: if not found, wait 1.5 seconds and try one last time
    if (!leadExists) {
      console.log(`Lead ${id} not found immediately. Retrying in 1.5s...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      leadExists = await prisma.lead.findFirst({ where: { id } });
    }
    
    if (!leadExists) {
      const totalLeads = await prisma.lead.count();
      console.error(`Lead with ID ${id} not found after retry. Total leads in DB: ${totalLeads}`);
      // Return more info to n8n to help us debug
      return NextResponse.json({ 
        error: 'Lead not found', 
        id_requested: id,
        id_length: id?.length,
        total_leads_in_db: totalLeads,
        message: "The ID was not found. If total_leads_in_db is 0, your API is looking at the wrong database."
      }, { status: 404 });
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
