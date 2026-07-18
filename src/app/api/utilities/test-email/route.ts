import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDatalazoConfig } from '@/lib/config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { resendApiKey, senderEmail, senderName, testRecipient } = data;

    if (!testRecipient) {
      return NextResponse.json({ error: 'Test recipient email is required.' }, { status: 400 });
    }

    // Load active settings to use as fallback
    const config = getDatalazoConfig();
    const settings = await prisma.settings.findUnique({ where: { id: 'global' } });

    // Determine values with fallback hierarchy: Request body -> Local config file -> Database settings -> Default
    const finalApiKey = resendApiKey || config.resendApiKey || process.env.RESEND_API_KEY;
    const finalSenderEmail = senderEmail || settings?.senderEmail || config.senderEmail || 'luis@datalazo.net';
    const finalSenderName = senderName || settings?.senderName || config.senderName || 'Luis Lazo';

    if (!finalApiKey || finalApiKey.includes('YOUR_RESEND_API_KEY_HERE') || finalApiKey.trim() === '') {
      return NextResponse.json({ error: 'Resend API Key is missing. Please enter it in the form or save it first.' }, { status: 400 });
    }

    if (!finalSenderEmail) {
      return NextResponse.json({ error: 'Sender Email (From) is required.' }, { status: 400 });
    }

    console.log(`Sending test email via Resend to ${testRecipient} from ${finalSenderName} <${finalSenderEmail}>`);

    const resend = new Resend(finalApiKey);
    const fromAddress = `${finalSenderName} <${finalSenderEmail}>`;

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: fromAddress,
      to: testRecipient,
      subject: '🧪 Datalazo Connection Test',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
          <h2 style="color: #10b981; margin-top: 0;">Connection Successful!</h2>
          <p>This is a test email sent from the <strong>System Utilities</strong> configuration panel on your Datalazo Dashboard.</p>
          <p>If you received this message, your Resend API credentials and domain settings are correct and ready to send marketing campaigns or automated invoices.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; line-height: 1.4; margin-bottom: 0;">
            <strong>Provider:</strong> Resend API<br/>
            <strong>Sender address:</strong> ${fromAddress}<br/>
            <strong>Destination:</strong> ${testRecipient}<br/>
            <strong>Timestamp:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    if (resendError) {
      console.error('Resend Error in Test Email:', resendError);
      return NextResponse.json({ error: resendError.message || 'Failed to send test email via Resend API.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: resendData?.id
    });
  } catch (error: any) {
    console.error('Test email endpoint exception:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
