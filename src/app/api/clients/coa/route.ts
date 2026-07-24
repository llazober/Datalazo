import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch Chart of Accounts entries for a client
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientName = searchParams.get('clientName') || '';

    const whereCondition = clientName
      ? { clientName: { equals: clientName, mode: 'insensitive' as const } }
      : {};

    const accounts = await prisma.clientChartOfAccounts.findMany({
      where: whereCondition,
      orderBy: { accountNumber: 'asc' },
    });

    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    console.error('Error fetching COA:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Chart of Accounts' },
      { status: 500 }
    );
  }
}

// POST: Add a new Chart of Accounts record
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientName, accountNumber, accountName, type, subType, level } = body;

    if (!clientName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: 'clientName, accountNumber, and accountName are required.' },
        { status: 400 }
      );
    }

    const newAccount = await prisma.clientChartOfAccounts.upsert({
      where: {
        clientName_accountNumber: {
          clientName,
          accountNumber,
        },
      },
      update: {
        accountName,
        type: type || null,
        subType: subType || null,
        level: level ? parseInt(level) : 0,
        updatedAt: new Date(),
      },
      create: {
        clientName,
        accountNumber,
        accountName,
        type: type || null,
        subType: subType || null,
        level: level ? parseInt(level) : 0,
      },
    });

    return NextResponse.json({ success: true, account: newAccount });
  } catch (error: any) {
    console.error('Error creating COA:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Chart of Accounts entry' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing Chart of Accounts record
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, accountNumber, accountName, type, subType, level } = body;

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const updatedAccount = await prisma.clientChartOfAccounts.update({
      where: { id },
      data: {
        accountNumber,
        accountName,
        type,
        subType,
        level: level ? parseInt(level) : 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, account: updatedAccount });
  } catch (error: any) {
    console.error('Error updating COA:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update Chart of Accounts entry' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a Chart of Accounts record
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    await prisma.clientChartOfAccounts.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting COA:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete Chart of Accounts entry' },
      { status: 500 }
    );
  }
}
