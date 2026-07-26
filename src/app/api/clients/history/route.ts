import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch Transaction History rules for a client or parentName
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientName = searchParams.get('clientName') || '';
    const parentName = searchParams.get('parentName') || '';

    const whereCondition: any = {};
    if (clientName) {
      whereCondition.clientName = { equals: clientName, mode: 'insensitive' as const };
    }
    if (parentName) {
      whereCondition.parentName = { equals: parentName, mode: 'insensitive' as const };
    }

    const historyRules = await prisma.clientTransactionHistory.findMany({
      where: whereCondition,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, historyRules });
  } catch (error: any) {
    console.error('Error fetching Transaction History rules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Transaction History rules' },
      { status: 500 }
    );
  }
}

// POST: Add a new Transaction History rule
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientName, parentName, pattern, accountNumber, accountName, transactionType } = body;

    if (!clientName || !pattern || !accountNumber) {
      return NextResponse.json(
        { error: 'clientName, pattern, and accountNumber are required.' },
        { status: 400 }
      );
    }

    const cleanPattern = pattern.toUpperCase().trim();
    const cleanTxType = transactionType ? transactionType.toUpperCase() : 'ALL';

    const newRule = await prisma.clientTransactionHistory.upsert({
      where: {
        clientName_pattern_transactionType: {
          clientName,
          pattern: cleanPattern,
          transactionType: cleanTxType,
        },
      },
      update: {
        parentName: parentName || 'VRT Services',
        accountNumber,
        accountName: accountName || null,
        source: 'MANUAL_EDIT',
        updatedAt: new Date(),
      },
      create: {
        clientName,
        parentName: parentName || 'VRT Services',
        pattern: cleanPattern,
        accountNumber,
        accountName: accountName || null,
        transactionType: cleanTxType,
        source: 'MANUAL_EDIT',
      },
    });

    return NextResponse.json({ success: true, rule: newRule });
  } catch (error: any) {
    console.error('Error creating Transaction History rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Transaction History rule' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing Transaction History rule
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, parentName, pattern, accountNumber, accountName, transactionType } = body;

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const updatedRule = await prisma.clientTransactionHistory.update({
      where: { id },
      data: {
        parentName: parentName || undefined,
        pattern: pattern ? pattern.toUpperCase().trim() : undefined,
        accountNumber,
        accountName: accountName !== undefined ? (accountName || null) : undefined,
        transactionType: transactionType ? transactionType.toUpperCase() : 'ALL',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, rule: updatedRule });
  } catch (error: any) {
    console.error('Error updating Transaction History rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update Transaction History rule' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a Transaction History rule
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    await prisma.clientTransactionHistory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting Transaction History rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete Transaction History rule' },
      { status: 500 }
    );
  }
}
