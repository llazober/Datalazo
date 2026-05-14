import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { id, email, status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    let lead;

    // Try to find by ID first (Most Accurate)
    if (id) {
      lead = await prisma.lead.findUnique({ where: { id } });
    } 
    // Fallback to email (Less Accurate)
    else if (email) {
      lead = await prisma.lead.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' }
      });
    }

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
