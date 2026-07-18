import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { getDatalazoConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { 
      invoiceNumber, 
      clientId, 
      clientName, 
      clientEmail, 
      clientCompany, 
      clientPhone, 
      items, 
      amount, 
      terms, 
      sendEmail,
      pdfBase64
    } = data;

    if (!invoiceNumber) {
      return NextResponse.json({ error: 'Invoice number is required.' }, { status: 400 });
    }
    if (!clientEmail) {
      return NextResponse.json({ error: 'Client email is required.' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required.' }, { status: 400 });
    }

    const parsedInvoiceNumber = parseInt(invoiceNumber);
    if (isNaN(parsedInvoiceNumber)) {
      return NextResponse.json({ error: 'Invoice number must be a valid integer.' }, { status: 400 });
    }

    // Check if invoice number is unique
    const existing = await prisma.invoice.findUnique({
      where: { invoiceNumber: parsedInvoiceNumber }
    });

    let status = 'CREATED';

    if (sendEmail) {
      const config = getDatalazoConfig();
      const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
      
      const finalApiKey = config.resendApiKey || process.env.RESEND_API_KEY;
      const finalSenderEmail = settings?.senderEmail || config.senderEmail || 'luis@datalazo.net';
      const finalSenderName = settings?.senderName || config.senderName || 'Datalazo LLC';

      if (!finalApiKey || finalApiKey.includes('YOUR_RESEND_API_KEY_HERE') || finalApiKey.trim() === '') {
        return NextResponse.json({ error: 'Resend API Key is missing. Configure it in the Utilities screen to email invoices.' }, { status: 400 });
      }

      const resend = new Resend(finalApiKey);
      const fromAddress = `${finalSenderName} <${finalSenderEmail}>`;

      // Build HTML for line items
      const itemsHtml = items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">${item.description || 'Service'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; text-align: right;">$${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `).join('');

      const formattedTermsHtml = terms ? terms.replace(/\n/g, '<br/>') : '';

      const invoiceEmailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
            <div>
              <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">${finalSenderName}</h2>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">7682 Tahitti Lane Apt 203<br/>Lake Worth FL 33467</p>
            </div>
            <div style="text-align: right;">
              <h1 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">INVOICE</h1>
              <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 14px; font-weight: 700;">#${parsedInvoiceNumber}</p>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Bill To</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #1e293b;">${clientCompany || clientName}</p>
            ${clientCompany ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #475569;">c/o ${clientName}</p>` : ''}
            <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">${clientEmail}</p>
            ${clientPhone ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">${clientPhone}</p>` : ''}
          </div>

          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;"><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; text-align: left;">Description</th>
                <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; text-align: right; width: 100px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="border-top: 2px solid #cbd5e1;">
                <td style="padding: 12px 10px; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; text-align: right;">Total Due</td>
                <td style="padding: 12px 10px; font-size: 16px; font-weight: 800; color: #0f172a; text-align: right; background-color: #f8fafc;">$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          ${terms ? `
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Terms & Conditions</p>
              <div style="font-size: 12px; color: #64748b; line-height: 1.5;">${formattedTermsHtml}</div>
            </div>
          ` : ''}
          
          <div style="border-top: 1px solid #f1f5f9; margin-top: 32px; padding-top: 16px; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">Thank you for your business!</p>
          </div>
        </div>
      `;

      const attachments = [];
      if (pdfBase64) {
        const parts = pdfBase64.split(',');
        const cleanBase64 = parts.length > 1 ? parts[1] : parts[0];
        attachments.push({
          content: Buffer.from(cleanBase64, 'base64'),
          filename: `Invoice_${parsedInvoiceNumber}.pdf`,
          contentType: 'application/pdf'
        });
      }

      const { error: resendError } = await resend.emails.send({
        from: fromAddress,
        to: clientEmail,
        subject: `Invoice #${parsedInvoiceNumber} from ${finalSenderName}`,
        html: invoiceEmailHtml,
        replyTo: finalSenderEmail,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      if (resendError) {
        console.error('Error sending invoice email:', resendError);
        return NextResponse.json({ error: `Failed to email invoice: ${resendError.message}` }, { status: 500 });
      }

      status = 'EMAILED';
    }

    let savedInvoice;
    if (existing) {
      savedInvoice = await prisma.invoice.update({
        where: { invoiceNumber: parsedInvoiceNumber },
        data: {
          clientId: clientId || null,
          clientName,
          clientEmail,
          clientCompany: clientCompany || null,
          clientPhone: clientPhone || null,
          items,
          amount: parseFloat(amount),
          terms: terms || null,
          status
        }
      });
    } else {
      savedInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: parsedInvoiceNumber,
          clientId: clientId || null,
          clientName,
          clientEmail,
          clientCompany: clientCompany || null,
          clientPhone: clientPhone || null,
          items,
          amount: parseFloat(amount),
          terms: terms || null,
          status
        }
      });
    }

    return NextResponse.json({ success: true, invoice: savedInvoice });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 });
  }
}
