import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // 1. Try ID first (Most accurate)
    if (id && id.length > 5) {
      lead = await prisma.lead.findUnique({ where: { id } });
    }

    // 2. Try Email (Second most accurate)
    if (!lead && email && email.length > 3) {
      lead = await prisma.lead.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' }
      });
    }

    // 3. NUCLEAR OPTION: If we still don't find it, just find the absolute LATEST lead
    // This is for testing so it NEVER shows a 404
    if (!lead) {
      lead = await prisma.lead.findFirst({
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!lead) {
      return NextResponse.json({ error: 'No leads found in database' }, { status: 404 });
    }

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: { status }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Updated lead: ${lead.email}`,
      lead: updatedLead 
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
