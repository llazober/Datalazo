import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch the lead
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API Key is missing.' }, { status: 500 });
    }

    let settings = await prisma.settings.findUnique({ where: { id: 'global' } });
    const fromAddress = settings 
      ? `${settings.senderName} <${settings.senderEmail}>`
      : 'Luis <luis@datalazo.net>';

    // 2. Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // 3. Send Email
    const discoveryLink = `https://datalazo.net/discovery?id=${lead.id}`;
    
    const { data, error } = await resend.emails.send({
      from: fromAddress, // Uses Settings from DB
      to: lead.email,
      subject: 'Your AI Automation Assessment - Datalazo',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <p>Hi ${lead.name},</p>
          <p>It was great speaking with you! To help us build your custom AI automation roadmap, please take a few minutes to complete our technical discovery assessment.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${discoveryLink}" style="background-color: #06b6d4; color: #000; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
              Start Assessment
            </a>
          </div>

          <p>Looking forward to reviewing your answers!</p>
          <p>Best regards,<br/><strong>${settings?.senderName || 'Luis Lazo'}</strong><br/>${settings?.agencyName || 'Datalazo Intelligence'}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: 'Failed to send via Resend', details: error }, { status: 500 });
    }

    // Update Lead status to CONTACTED
    await prisma.lead.update({
      where: { id },
      data: { status: 'CONTACTED' }
    });

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error: any) {
    console.error('Send Link Error:', error);
    return NextResponse.json({ 
      error: 'Failed to send discovery link.',
      details: error.message 
    }, { status: 500 });
  }
}
