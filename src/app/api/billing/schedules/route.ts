import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const schedules = await prisma.customerBillingSchedule.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { billingDay: 'asc' }
    });

    const formattedSchedules = schedules.map(s => ({
      id: s.id,
      customer_id: s.clientId,
      billing_amount: s.billingAmount,
      currency: s.currency,
      billing_day: s.billingDay,
      description: s.description,
      auto_send: s.autoSend,
      payment_terms_days: s.paymentTermsDays,
      status: s.status,
      last_billed_at: s.lastBilledAt ? s.lastBilledAt.toISOString() : null,
      next_billing_date: s.nextBillingDate ? s.nextBillingDate.toISOString() : null,
      created_at: s.createdAt.toISOString(),
      updated_at: s.updatedAt.toISOString(),
      legal_name: s.client.company || s.client.name,
      client_name: s.client.name,
      email: s.client.email
    }));

    return NextResponse.json({ schedules: formattedSchedules, data: formattedSchedules });
  } catch (error: any) {
    console.error('Error fetching billing schedules:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const customer_id = payload.customer_id || payload.clientId;
    const billing_amount = parseFloat(payload.billing_amount || payload.billingAmount || 0);
    const billing_day = parseInt(payload.billing_day || payload.billingDay || 1, 10);
    const description = payload.description || 'Monthly Advisory & Software Retainer';
    const auto_send = payload.auto_send !== undefined ? Boolean(payload.auto_send) : true;
    const payment_terms_days = parseInt(payload.payment_terms_days || payload.paymentTermsDays || 15, 10);

    if (!customer_id || isNaN(billing_amount) || billing_amount <= 0) {
      return NextResponse.json({ error: 'Valid customer_id and positive billing_amount are required.' }, { status: 400 });
    }

    if (isNaN(billing_day) || billing_day < 1 || billing_day > 31) {
      return NextResponse.json({ error: 'billing_day must be between 1 and 31.' }, { status: 400 });
    }

    const clientExists = await prisma.client.findUnique({ where: { id: customer_id } });
    if (!clientExists) {
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    const schedule = await prisma.customerBillingSchedule.create({
      data: {
        clientId: customer_id,
        billingAmount: billing_amount,
        billingDay: billing_day,
        description,
        autoSend: auto_send,
        paymentTermsDays: payment_terms_days,
        status: 'Active'
      }
    });

    return NextResponse.json({ status: 'success', schedule_id: schedule.id, schedule });
  } catch (error: any) {
    console.error('Error creating billing schedule:', error);
    return NextResponse.json({ error: error.message || 'Failed to create schedule' }, { status: 500 });
  }
}
