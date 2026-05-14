import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    let lead = null;

    // 1. Try finding by ID
    if (id) {
      lead = await prisma.lead.findUnique({ where: { id } });
    }

    // 2. If not found by ID, try finding by email (Fallback)
    if (!lead && email) {
      lead = await prisma.lead.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!lead) {
      const totalLeads = await prisma.lead.count();
      return NextResponse.json({ 
        error: 'Lead not found by ID or Email',
        id_received: id || 'none',
        email_received: email || 'none',
        total_leads_in_db: totalLeads
      }, { status: 404 });
    }

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: { status }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Lead status updated to ${status}`,
      lead: updatedLead 
    });
  } catch (error) {
    console.error('Update Lead Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
