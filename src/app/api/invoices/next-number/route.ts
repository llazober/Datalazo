import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoiceNumber: 'desc' }
    });
    const nextNumber = lastInvoice ? lastInvoice.invoiceNumber + 1 : 2309;
    return NextResponse.json({ nextNumber });
  } catch (error: any) {
    console.error('Error fetching next invoice number:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch invoice number' }, { status: 500 });
  }
}
