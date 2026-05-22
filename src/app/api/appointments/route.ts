import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { leadId, date, timeSlot, phone } = await req.json();

    if (!leadId || !date || !timeSlot) {
      return NextResponse.json({ error: 'Missing booking details' }, { status: 400 });
    }

    // 0. Fetch the lead details first
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
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
        phone: phone || lead.phone || undefined
      }
    });

    // 2.5. Send email notification to the office
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
        
        const officeEmail = settings?.senderEmail || 'luis@datalazo.net';
        const fromAddress = settings 
          ? `${settings.senderName} <${settings.senderEmail}>`
          : 'Datalazo Intelligence <luis@datalazo.net>';

        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

        await resend.emails.send({
          from: fromAddress,
          to: officeEmail,
          subject: `🚨 New Booking Scheduled: ${lead.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #06b6d4; border-bottom: 2px solid #06b6d4; padding-bottom: 10px; margin-top: 0;">New Appointment Booked</h2>
              
              <p><strong>Lead Name:</strong> ${lead.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></p>
              <p><strong>Phone:</strong> ${phone || lead.phone || 'N/A'}</p>
              <p><strong>Company:</strong> ${lead.company || 'Private Individual'}</p>
              <p><strong>Service Requested:</strong> ${lead.service}</p>
              
              <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #0f766e;">Appointment Details:</p>
                <p style="margin: 5px 0 0 0;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 5px 0 0 0;"><strong>Time Slot:</strong> ${timeSlot}</p>
              </div>

              ${lead.message ? `<p><strong>Original Message:</strong><br/><em>${lead.message}</em></p>` : ''}
              ${lead.notes ? `<p><strong>Internal Notes:</strong><br/><em>${lead.notes}</em></p>` : ''}
              
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #999; text-align: center;">Datalazo Intelligence Booking System</p>
            </div>
          `
        });
        console.log('Office booking email notification sent.');
      } catch (emailErr) {
        console.error('Failed to send office booking notification email:', emailErr);
      }
    }


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
