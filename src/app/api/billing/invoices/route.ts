import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNumber, sendInvoiceEmail } from '@/lib/billing-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = (searchParams.get('status') || 'ALL').toUpperCase();
    const customerIdParam = searchParams.get('customer_id') || searchParams.get('clientId');

    const today = new Date();

    const whereClause: any = {};

    if (statusParam !== 'ALL') {
      if (statusParam === 'OVERDUE') {
        whereClause.OR = [
          { status: 'OVERDUE' },
          { status: 'SENT', dueDate: { lt: today } }
        ];
      } else {
        whereClause.status = statusParam;
      }
    }

    if (customerIdParam) {
      whereClause.clientId = customerIdParam;
    }

    const invoices = await prisma.customerInvoice.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' }
    });

    const formattedInvoices = invoices.map(i => {
      let currentStatus = i.status;
      if (currentStatus === 'SENT' && i.dueDate < today) {
        currentStatus = 'OVERDUE';
      }

      return {
        id: i.id,
        invoice_number: i.invoiceNumber,
        customer_id: i.clientId,
        schedule_id: i.scheduleId,
        amount: i.amount,
        tax_amount: i.taxAmount,
        total_amount: i.totalAmount,
        status: currentStatus,
        issue_date: i.issueDate.toISOString().split('T')[0],
        due_date: i.dueDate.toISOString().split('T')[0],
        paid_at: i.paidAt ? i.paidAt.toISOString() : null,
        payment_method: i.paymentMethod,
        transaction_ref: i.transactionRef,
        notes: i.notes,
        description: i.description,
        items_json: i.itemsJson,
        created_at: i.createdAt.toISOString(),
        updated_at: i.updatedAt.toISOString(),
        legal_name: i.client.company || i.client.name,
        client_name: i.client.name,
        email: i.client.email
      };
    });

    return NextResponse.json({ invoices: formattedInvoices, data: formattedInvoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const customer_id = payload.customer_id || payload.clientId;
    const amount = parseFloat(payload.amount || 0);
    const description = payload.description || 'Professional Advisory Services';
    const due_days = parseInt(payload.due_days || payload.dueDays || 15, 10);
    const send_now = payload.send_now !== undefined ? Boolean(payload.send_now) : true;

    if (!customer_id || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid customer_id and positive amount required.' }, { status: 400 });
    }

    const clientExists = await prisma.client.findUnique({ where: { id: customer_id } });
    if (!clientExists) {
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    const invNumber = await generateInvoiceNumber();
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + due_days);

    const inv = await prisma.customerInvoice.create({
      data: {
        invoiceNumber: invNumber,
        clientId: customer_id,
        amount: amount,
        taxAmount: 0.0,
        totalAmount: amount,
        status: 'DRAFT',
        issueDate: today,
        dueDate: dueDate,
        description: description
      }
    });

    if (send_now) {
      try {
        await sendInvoiceEmail(inv.id);
      } catch (sendErr: any) {
        console.error('Error auto-sending manual invoice:', sendErr);
      }
    }

    return NextResponse.json({
      status: 'success',
      invoice_id: inv.id,
      invoice_number: invNumber,
      invoice: inv
    });
  } catch (error: any) {
    console.error('Error creating manual invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 });
  }
}
