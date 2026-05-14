import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { leadId, date, timeSlot, phone } = await req.json();

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

    // 2. Update the Lead status to BOOKED and save phone
    await prisma.lead.update({
      where: { id: leadId },
      data: { 
        status: 'BOOKED',
        phone: phone || undefined
      }
    });


    // 3. Notify n8n
    const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_UR || process.env.WEBHOOK_URL || '';
    
    if (webhookUrl) {
      try {
        const n8nResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            status: 'BOOKED',
            appointment: {
              date,
              timeSlot
            }
          }),
        });
        console.log('n8n Booking Response:', n8nResponse.status);
      } catch (err) {
        console.error('n8n Booking notification failed:', err);
      }
    }



    return NextResponse.json({ 
      success: true, 
      appointment 
    });
  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
