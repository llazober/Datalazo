import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { getDatalazoConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { leadId, subject, body } = data;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required.' }, { status: 400 });
    }

    const config = getDatalazoConfig();
    const resendApiKey = config.resendApiKey || process.env.RESEND_API_KEY;

    if (!resendApiKey || resendApiKey.includes('YOUR_RESEND_API_KEY_HERE')) {
      return NextResponse.json({ error: 'Resend API Key is missing. Please add it to datalazo.config.json or your server environment variables.' }, { status: 500 });
    }

    // 1. Fetch Lead
    const lead = await prisma.marketingLead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const emailSubject = subject || lead.aiSubject;
    const emailBody = body || lead.aiBody;

    if (!emailSubject || !emailBody) {
      return NextResponse.json({ error: 'Email subject and body are required to send.' }, { status: 400 });
    }

    // 2. Fetch Sender Settings
    let settings = await prisma.settings.findUnique({ where: { id: 'global' } });
    const finalSenderName = settings?.senderName || config.senderName || 'Luis Lazo';
    const finalSenderEmail = settings?.senderEmail || config.senderEmail || 'luis@datalazo.net';
    const fromAddress = `${finalSenderName} <${finalSenderEmail}>`;

    // 3. Initialize Resend
    const resend = new Resend(resendApiKey);

    // Convert newlines to HTML line breaks for the email body
    const formattedHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; font-size: 15px;">
        ${emailBody.replace(/\n/g, '<br/>')}
      </div>
    `;

    console.log(`Sending outreach email to ${lead.email} from ${fromAddress}`);

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: fromAddress,
      to: lead.email,
      subject: emailSubject,
      html: formattedHtml,
      replyTo: finalSenderEmail,
    });

    if (resendError) {
      console.error('Resend Error in Marketing Outreach:', resendError);
      await prisma.marketingLead.update({
        where: { id: leadId },
        data: { status: 'FAILED' }
      });
      return NextResponse.json({ error: 'Failed to send email via Resend.', details: resendError }, { status: 500 });
    }

    // 4. Update lead record status and final email texts
    const updatedLead = await prisma.marketingLead.update({
      where: { id: leadId },
      data: {
        aiSubject: emailSubject,
        aiBody: emailBody,
        status: 'SENT'
      }
    });

    return NextResponse.json({
      success: true,
      messageId: resendData?.id,
      lead: updatedLead
    });
  } catch (error: any) {
    console.error('Send Outreach Email Error:', error);
    return NextResponse.json({ error: 'Failed to send outreach email.', details: error.message }, { status: 500 });
  }
}
