import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { leadId, date, timeSlot } = await req.json();

    if (!leadId || !date || !timeSlot) {
      return NextResponse.json({ error: 'Missing booking details' }, { status: 400 });
    }

    // 1. Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        leadId,
        date: new Date(date),
        timeSlot,
      }
    });

    // 2. Update the Lead status to BOOKED
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'BOOKED' }
    });

    // 3. Optional: Notify n8n or admin here if needed
    // For now, the database is updated correctly.

    return NextResponse.json({ 
      success: true, 
      appointment 
    });
  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
