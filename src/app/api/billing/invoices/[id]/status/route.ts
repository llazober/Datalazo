import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revertScheduleLastBilledAtIfNeeded } from '@/lib/billing-utils';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  return handleStatusUpdate(req, props);
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  return handleStatusUpdate(req, props);
}

async function handleStatusUpdate(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const payload = await req.json();

    const newStatus = (payload.status || 'PAID').toUpperCase();
    const paymentMethod = payload.payment_method || payload.paymentMethod || 'ACH / Bank Transfer';
    const transactionRef = payload.transaction_ref || payload.transactionRef || '';
    const notes = payload.notes || '';

    const validStatuses = ['PAID', 'SENT', 'OVERDUE', 'DRAFT', 'CANCELLED', 'VOID'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }

    const inv = await prisma.customerInvoice.findFirst({
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

    if (['CANCELLED', 'VOID'].includes(newStatus) && inv.scheduleId) {
      await revertScheduleLastBilledAtIfNeeded(inv.scheduleId, inv.id);
    }

    const updateData: any = {
      status: newStatus,
      notes: notes || (['CANCELLED', 'VOID'].includes(newStatus) ? `Voided on ${new Date().toLocaleDateString()}` : undefined)
    };

    if (newStatus === 'PAID') {
      updateData.paidAt = new Date();
      updateData.paymentMethod = paymentMethod;
      updateData.transactionRef = transactionRef;
    }

    const updatedInv = await prisma.customerInvoice.update({
      where: { id: inv.id },
      data: updateData
    });

    return NextResponse.json({
      status: 'success',
      message: `Invoice #${inv.invoiceNumber} status updated to ${newStatus}.`,
      invoice: updatedInv
    });
  } catch (error: any) {
    console.error('Error updating invoice status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update invoice status' }, { status: 500 });
  }
}
