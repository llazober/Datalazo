import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const payload = await req.json();

    const customer_id = payload.customer_id || payload.clientId;
    const billing_amount = parseFloat(payload.billing_amount || payload.billingAmount || 0);
    const billing_day = parseInt(payload.billing_day || payload.billingDay || 1, 10);
    const description = payload.description || 'Monthly Advisory & Software Retainer';
    const auto_send = payload.auto_send !== undefined ? Boolean(payload.auto_send) : true;
    const payment_terms_days = parseInt(payload.payment_terms_days || payload.paymentTermsDays || 15, 10);
    const status = payload.status || 'Active';

    if (!customer_id || isNaN(billing_amount) || billing_amount <= 0) {
      return NextResponse.json({ error: 'Valid customer_id and positive billing_amount are required.' }, { status: 400 });
    }

    if (isNaN(billing_day) || billing_day < 1 || billing_day > 31) {
      return NextResponse.json({ error: 'billing_day must be between 1 and 31.' }, { status: 400 });
    }

    const schedule = await prisma.customerBillingSchedule.update({
      where: { id },
      data: {
        clientId: customer_id,
        billingAmount: billing_amount,
        billingDay: billing_day,
        description,
        autoSend: auto_send,
        paymentTermsDays: payment_terms_days,
        status
      }
    });

    return NextResponse.json({ status: 'success', message: `Schedule #${id} updated successfully.`, schedule });
  } catch (error: any) {
    console.error('Error updating billing schedule:', error);
    return NextResponse.json({ error: error.message || 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    await prisma.customerBillingSchedule.delete({
      where: { id }
    });
    return NextResponse.json({ status: 'success', message: `Schedule #${id} deleted.` });
  } catch (error: any) {
    console.error('Error deleting billing schedule:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete schedule' }, { status: 500 });
  }
}
