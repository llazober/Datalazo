import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatInvoiceEmailHtml } from '@/lib/billing-utils';
import { getDatalazoConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;

    const inv = await prisma.customerInvoice.findFirst({
      where: {
        OR: [
          { id: id },
          { invoiceNumber: id }
        ]
      },
      include: { client: true }
    });

    if (!inv) {
      return new NextResponse('<h2>Invoice not found</h2>', {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const config = getDatalazoConfig();
    const settings = await prisma.settings.findUnique({ where: { id: 'global' } });

    const agencyName = settings?.senderName || config.senderName || 'Datalazo LLC';

    const htmlContent = formatInvoiceEmailHtml(
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
      { agencyName }
    );

    return new NextResponse(htmlContent, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error: any) {
    return new NextResponse(`<h2>Error loading invoice: ${error.message}</h2>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
