import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        lead: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Clients Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, name, email, phone, company, services, notes, totalPayment, paymentDate, subdomain } = body;

    if (!name || !email || !services) {
      return NextResponse.json({ error: 'Name, email, and services are required' }, { status: 400 });
    }

    // Check if client email already exists
    const existing = await prisma.client.findUnique({
      where: { email }
    });
    if (existing) {
      return NextResponse.json({ error: 'Client with this email already exists' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        leadId: leadId || null,
        name,
        email,
        phone: phone || null,
        company: company || null,
        services,
        notes: notes || null,
        totalPayment: totalPayment ? parseFloat(totalPayment) : 0,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        subdomain: subdomain ? subdomain.trim() : null,
      }
    });

    // If there is an associated lead, update its status to WON
    if (leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: 'WON' }
      });
    }

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error('Client Create Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, phone, company, services, notes, totalPayment, paymentDate, stripeStatus, recurringAmount, subdomain } = body;

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        company,
        services,
        notes,
        totalPayment: totalPayment !== undefined ? parseFloat(totalPayment) : undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        stripeStatus,
        recurringAmount: recurringAmount !== undefined ? parseFloat(recurringAmount) : undefined,
        subdomain: subdomain !== undefined ? (subdomain.trim() === '' ? null : subdomain.trim()) : undefined
      }
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error('Client Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    await prisma.client.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Client Delete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
