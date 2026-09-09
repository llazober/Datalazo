import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendInvoiceEmail } from '@/lib/billing-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;

    // Find invoice by ID or invoiceNumber
    let inv = await prisma.customerInvoice.findFirst({
      where: {
        OR: [
          { id: id },
          { invoiceNumber: id }
        ]
      }
    });

    if (!inv) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    const res = await sendInvoiceEmail(inv.id);
    return NextResponse.json({
      status: 'success',
      message: `Invoice #${res.invoiceNumber} sent successfully to ${res.recipient}`,
      data: res
    });
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send invoice email' }, { status: 500 });
  }
}
