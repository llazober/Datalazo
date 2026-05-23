import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDatalazoConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
    }

    const startOfDay = new Date(dateParam);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(dateParam);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        timeSlot: true
      }
    });

    const bookedSlots = appointments.map(apt => apt.timeSlot);
    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error('Fetch Booked Slots Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    const config = getDatalazoConfig();
    const resendKey = config.resendApiKey || process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
        
        const officeEmail = 'luislazo@datalazo.net';
        const fromAddress = settings?.senderEmail 
          ? `${settings.senderName || 'Datalazo'} <${settings.senderEmail}>`
          : config.senderEmail
            ? `${config.senderName || 'Datalazo'} <${config.senderEmail}>`
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

        // Send email confirmation to customer
        await resend.emails.send({
          from: fromAddress,
          to: lead.email,
          subject: `Confirmed: Your AI Audit with Datalazo`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #06b6d4; border-bottom: 2px solid #06b6d4; padding-bottom: 10px; margin-top: 0;">AI Audit Confirmed</h2>
              
              <p>Hi ${lead.name},</p>
              <p>Your AI Audit appointment has been successfully scheduled. Here are your booking details:</p>
              
              <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #0f766e;">Appointment Details:</p>
                <p style="margin: 5px 0 0 0;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 5px 0 0 0;"><strong>Time Slot:</strong> ${timeSlot}</p>
              </div>

              <p>If you need to make any changes or reschedule, please reply directly to this email.</p>
              
              <p>Looking forward to speaking with you!</p>
              <p>Best regards,<br/><strong>${settings?.senderName || 'Luis Lazo'}</strong><br/>${settings?.agencyName || 'Datalazo Intelligence'}</p>
              
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #999; text-align: center;">Powered by Datalazo Intelligence</p>
            </div>
          `
        });
        console.log('Customer booking confirmation email sent.');
      } catch (emailErr) {
        console.error('Failed to send booking emails:', emailErr);
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
