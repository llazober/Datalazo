import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const clientName = formData.get('clientName') as string;
    const file = formData.get('file') as File;

    if (!clientName || !file) {
      return NextResponse.json(
        { error: 'Missing clientName or CSV file' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file is empty or missing headers' },
        { status: 400 }
      );
    }

    // Header parsing
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    
    // Find column indexes
    const patternIdx = headers.findIndex((h) =>
      /pattern|description|vendor|keyword/i.test(h)
    );
    const acctNumIdx = headers.findIndex((h) =>
      /account\s*number|acct|gl|code/i.test(h)
    );
    const acctNameIdx = headers.findIndex((h) =>
      /account\s*name|category|drake/i.test(h)
    );
    const txTypeIdx = headers.findIndex((h) =>
      /type|transaction\s*type/i.test(h)
    );

    if (patternIdx === -1 || acctNumIdx === -1) {
      return NextResponse.json(
        {
          error:
            'CSV must contain "Pattern/Description" and "Account Number" columns.',
        },
        { status: 400 }
      );
    }

    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, '').trim());

      const pattern = cleanCols[patternIdx]?.toUpperCase();
      const accountNumber = cleanCols[acctNumIdx];
      const accountName = acctNameIdx !== -1 ? cleanCols[acctNameIdx] : null;
      const transactionType = txTypeIdx !== -1 ? cleanCols[txTypeIdx]?.toUpperCase() || 'ALL' : 'ALL';

      if (!pattern || !accountNumber) continue;

      await prisma.clientTransactionHistory.upsert({
        where: {
          clientName_pattern_transactionType: {
            clientName,
            pattern,
            transactionType,
          },
        },
        update: {
          accountNumber,
          accountName,
          source: 'EXCEL_IMPORT',
          updatedAt: new Date(),
        },
        create: {
          clientName,
          pattern,
          accountNumber,
          accountName,
          transactionType,
          source: 'EXCEL_IMPORT',
        },
      });
      count++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${count} Transaction History rules for ${clientName}`,
      count,
    });
  } catch (error: any) {
    console.error('Error uploading Transaction History:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}
