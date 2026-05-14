import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRequest(req, params);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRequest(req, params);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ 
    message: "Lead Status Update API is active and ready for PATCH/POST requests.",
    id_received: id
  });
}

async function handleRequest(
  req: Request,
  params: Promise<{ id: string }>
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
      const recentLeads = await prisma.lead.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true }
      });
      
      console.error(`Lead with ID ${id} not found after retry. Total leads in DB: ${totalLeads}`);
      console.log('Recent leads in DB:', JSON.stringify(recentLeads));

      // Return more info to n8n to help us debug
      return NextResponse.json({ 
        error: 'Lead not found', 
        id_requested: id,
        id_length: id?.length,
        total_leads_in_db: totalLeads,
        recent_ids_in_db: recentLeads.map(l => l.id),
        message: "The ID was not found. Look at 'recent_ids_in_db' to see if the format matches your request."
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
