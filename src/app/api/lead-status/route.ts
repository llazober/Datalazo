import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.lead_id || body.id;
    const email = body.email;
    const status = body.status;

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    let lead = null;

    // Try ID first
    if (id && id.length > 5) {
      lead = await prisma.lead.findUnique({ where: { id } });
    }

    // Try Email fallback
    if (!lead && email && email.length > 3) {
      lead = await prisma.lead.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!lead) {
      return NextResponse.json({ 
        error: 'Lead not found', 
        received: { id, email, status } 
      }, { status: 404 });
    }

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: { status }
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Update Status Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
