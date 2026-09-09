import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { getDatalazoConfig } from '@/lib/config';

export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear().toString();
  const lastInvoice = await prisma.customerInvoice.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true }
  });

  let nextNum = 1001;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split('-');
    if (parts.length >= 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    } else {
      const count = await prisma.customerInvoice.count();
      nextNum = 1001 + count;
    }
  }

  return `INV-${currentYear}-${nextNum}`;
}

export function formatDateMMDDYYYY(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'N/A';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export function formatInvoiceEmailHtml(
  invoice: {
    invoiceNumber: string;
    issueDate?: Date | string;
    dueDate?: Date | string;
    description?: string | null;
    amount: number;
    totalAmount?: number;
  },
  client: {
    name?: string | null;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
  },
  senderInfo?: {
    agencyName?: string;
    senderEmail?: string;
  }
): string {
  const invNum = invoice.invoiceNumber || 'INV-0000';
  const issueDateStr = formatDateMMDDYYYY(invoice.issueDate);
  const dueDateStr = formatDateMMDDYYYY(invoice.dueDate);
  const desc = invoice.description || 'Professional Services & Monthly Advisory';
  const totalAmt = invoice.totalAmount ?? invoice.amount ?? 0.0;
  const clientDisplayName = client.company || client.name || 'Valued Client';
  const agencyName = senderInfo?.agencyName || 'Datalazo LLC';

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: #0f172a; padding: 24px 32px; color: #ffffff;">
          <table style="width: 100%; border-collapse: collapse;">
              <tr>
                  <td style="vertical-align: top;">
                      <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${agencyName}</h2>
                      <p style="margin: 6px 0 0 0; color: #38bdf8; font-size: 13.5px; font-weight: 600; line-height: 1.45;">
                          Billing & Invoicing Services<br/>
                          7682 Tahitti Lane Apt 203<br/>
                          Lake Worth, FL 33467
                      </p>
                  </td>
                  <td style="text-align: right; vertical-align: top;">
                      <span style="display: inline-block; font-size: 14px; font-weight: 700; background: #1e293b; color: #38bdf8; padding: 6px 14px; border-radius: 6px; border: 1px solid #334155;">INVOICE</span>
                      <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1; font-family: monospace;">#${invNum}</p>
                  </td>
              </tr>
          </table>
      </div>
      <div style="padding: 32px; color: #334155;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                  <td style="vertical-align: top;">
                      <strong style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Billed To:</strong><br/>
                      <span style="font-size: 16px; font-weight: 700; color: #0f172a; display: inline-block; margin-top: 4px;">${clientDisplayName}</span><br/>
                      ${client.name && client.company ? `<span style="font-size: 13px; color: #64748b;">Attn: ${client.name}</span><br/>` : ''}
                      ${client.email ? `<span style="font-size: 13px; color: #64748b;">${client.email}</span><br/>` : ''}
                      ${client.phone ? `<span style="font-size: 13px; color: #64748b;">${client.phone}</span>` : ''}
                  </td>
                  <td style="vertical-align: top; text-align: right;">
                      <span style="font-size: 13px; color: #64748b;">Issue Date: <strong style="color: #0f172a;">${issueDateStr}</strong></span><br/>
                      <span style="font-size: 13px; color: #dc2626;">Payment Due: <strong style="color: #dc2626;">${dueDateStr}</strong></span>
                  </td>
              </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #f1f5f9; border-radius: 8px; overflow: hidden;">
              <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
                      <th style="padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">Description / Service</th>
                      <th style="padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #475569; text-align: right; letter-spacing: 0.5px;">Amount</th>
                  </tr>
              </thead>
              <tbody>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 16px; font-size: 14px; color: #1e293b; white-space: pre-wrap;">${desc}</td>
                      <td style="padding: 16px; font-size: 15px; font-weight: 700; text-align: right; color: #0f172a;">$${totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
              </tbody>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                  <td style="text-align: right; font-size: 14px; color: #64748b; font-weight: 600;">Total Amount Due:</td>
                  <td style="text-align: right; font-size: 22px; color: #0f172a; font-weight: 800; width: 180px;">$${totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style="font-size: 12px; color: #64748b; font-weight: 400;">USD</span></td>
              </tr>
          </table>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-top: 28px; font-size: 13px; color: #475569;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #0f172a; font-size: 14px;">💳 Terms & Payment Instructions:</p>
              <p style="margin: 0; line-height: 1.6; color: #1e293b; font-size: 13px;">
                  Payment is due within payment terms. Please submit payments via ACH bank transfer, Zelle, or credit card as instructed.
              </p>
          </div>
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} ${agencyName} — All rights reserved.
      </div>
  </div>
  `;
}

export async function sendInvoiceEmail(invoiceId: string) {
  const inv = await prisma.customerInvoice.findUnique({
    where: { id: invoiceId },
    include: { client: true }
  });

  if (!inv) {
    throw new Error('Invoice not found');
  }
  if (!inv.client || !inv.client.email) {
    throw new Error(`Client '${inv.client?.name || inv.client?.company || 'Unknown'}' has no recipient email address.`);
  }

  const config = getDatalazoConfig();
  const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
  
  const finalApiKey = config.resendApiKey || process.env.RESEND_API_KEY;
  const finalSenderEmail = settings?.senderEmail || config.senderEmail || 'luis@datalazo.net';
  const finalSenderName = settings?.senderName || config.senderName || 'Datalazo LLC';

  if (!finalApiKey || finalApiKey.includes('YOUR_RESEND_API_KEY_HERE') || finalApiKey.trim() === '') {
    throw new Error('Resend API key missing. Configure it in Utilities.');
  }

  const resend = new Resend(finalApiKey);
  const htmlBody = formatInvoiceEmailHtml(
    {
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      description: inv.description,
      amount: inv.amount,
      totalAmount: inv.totalAmount
    },
    {
      name: inv.client.name,
      company: inv.client.company,
      email: inv.client.email,
      phone: inv.client.phone
    },
    {
      agencyName: finalSenderName,
      senderEmail: finalSenderEmail
    }
  );

  const { error: resendError } = await resend.emails.send({
    from: `${finalSenderName} <${finalSenderEmail}>`,
    to: inv.client.email,
    subject: `Invoice #${inv.invoiceNumber} from ${finalSenderName} ($${inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
    html: htmlBody,
    replyTo: finalSenderEmail
  });

  if (resendError) {
    throw new Error(`Resend Error: ${resendError.message}`);
  }

  await prisma.customerInvoice.update({
    where: { id: invoiceId },
    data: {
      status: 'SENT',
      issueDate: new Date()
    }
  });

  return { success: true, recipient: inv.client.email, invoiceNumber: inv.invoiceNumber };
}

export async function revertScheduleLastBilledAtIfNeeded(scheduleId: string, targetInvoiceId?: string) {
  if (!scheduleId) return;

  try {
    const priorInvoice = await prisma.customerInvoice.findFirst({
      where: {
        scheduleId: scheduleId,
        id: targetInvoiceId ? { not: targetInvoiceId } : undefined,
        status: { notIn: ['CANCELLED', 'VOID'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (priorInvoice) {
      await prisma.customerBillingSchedule.update({
        where: { id: scheduleId },
        data: { lastBilledAt: priorInvoice.createdAt }
      });
    } else {
      await prisma.customerBillingSchedule.update({
        where: { id: scheduleId },
        data: { lastBilledAt: null }
      });
    }
  } catch (err) {
    console.error(`Error reverting lastBilledAt for schedule #${scheduleId}:`, err);
  }
}

export async function runDailyBillingJob() {
  const today = new Date();
  const currentDay = today.getDate();

  // Find active schedules that are due for billing in current month
  const activeSchedules = await prisma.customerBillingSchedule.findMany({
    where: {
      status: 'Active'
    },
    include: { client: true }
  });

  let generatedCount = 0;

  for (const s of activeSchedules) {
    const lastBilled = s.lastBilledAt ? new Date(s.lastBilledAt) : null;
    const billedThisMonth = lastBilled && lastBilled.getMonth() === today.getMonth() && lastBilled.getFullYear() === today.getFullYear();

    if (billedThisMonth) {
      continue; // Already billed for this month
    }

    const isDueTodayOrPast = s.billingDay <= currentDay;

    if (isDueTodayOrPast) {
      const invNumber = await generateInvoiceNumber();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + (s.paymentTermsDays || 15));

      const newInv = await prisma.customerInvoice.create({
        data: {
          invoiceNumber: invNumber,
          clientId: s.clientId,
          scheduleId: s.id,
          amount: s.billingAmount,
          taxAmount: 0.0,
          totalAmount: s.billingAmount,
          status: 'DRAFT',
          issueDate: today,
          dueDate: dueDate,
          description: s.description || 'Monthly Recurring Advisory & Software Retainer'
        }
      });

      await prisma.customerBillingSchedule.update({
        where: { id: s.id },
        data: { lastBilledAt: today }
      });

      generatedCount++;

      if (s.autoSend) {
        try {
          await sendInvoiceEmail(newInv.id);
        } catch (emailErr) {
          console.error(`[RECURRING BILLING EMAIL ERROR] Invoice #${invNumber}:`, emailErr);
        }
      }
    }
  }

  return { status: 'success', generatedCount, day: currentDay };
}
