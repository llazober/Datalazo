import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let receivedId = 'unknown';
  try {
    const { id, email, status } = await req.json();
    receivedId = id || email || 'unknown';

    if ((!id && !email) || !status) {
      return NextResponse.json({ error: 'Missing id/email or status' }, { status: 400 });
    }

    console.log(`Simplified Update: Lead ${receivedId} -> ${status}`);

    // Try to find by ID first, then by Email
    let lead;
    if (id && !id.includes('{{')) {
      lead = await prisma.lead.findFirst({ where: { id } });
    }
    
    if (!lead && email && !email.includes('{{')) {
      lead = await prisma.lead.findFirst({ where: { email } });
    }

    if (!lead) {
      const totalLeads = await prisma.lead.count();
      return NextResponse.json({ 
        error: 'Lead not found by ID or Email',
        id_received: id,
        email_received: email,
        total_leads_in_db: totalLeads
      }, { status: 404 });
    }

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
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
