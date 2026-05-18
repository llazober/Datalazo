import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { company: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.marketingLead.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    console.error('Fetch Marketing Leads Error:', error);
    return NextResponse.json({ error: 'Failed to fetch marketing leads.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const newLead = await prisma.marketingLead.create({
      data: {
        name: data.name || null,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        website: data.website || null,
        address: data.address || null,
        category: data.category || null,
        notes: data.notes || null,
        status: data.status || 'NEW',
      },
    });

    return NextResponse.json({ success: true, lead: newLead });
  } catch (error: any) {
    console.error('Create Marketing Lead Error:', error);
    return NextResponse.json({ error: 'Failed to create marketing lead.' }, { status: 500 });
  }
}
