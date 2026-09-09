import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revertScheduleLastBilledAtIfNeeded } from '@/lib/billing-utils';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;

    const inv = await prisma.customerInvoice.findFirst({
      where: {
        OR: [
          { id: id },
          { invoiceNumber: id }
        ]
      }
    });

    if (inv) {
      if (inv.scheduleId) {
        await revertScheduleLastBilledAtIfNeeded(inv.scheduleId, inv.id);
      }
      await prisma.customerInvoice.delete({
        where: { id: inv.id }
      });
    }

    return NextResponse.json({ status: 'success', message: `Invoice deleted.` });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete invoice' }, { status: 500 });
  }
}
