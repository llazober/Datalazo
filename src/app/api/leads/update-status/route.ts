import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, status } = await req.json();

    if (!email || !status) {
      return NextResponse.json({ error: 'Missing email or status' }, { status: 400 });
    }

    // Find the latest lead with this email and update it
    const lead = await prisma.lead.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
