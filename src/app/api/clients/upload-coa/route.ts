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

    const parentNameFromForm = (formData.get('parentName') as string) || 'VRT Services';

    // Header parsing
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    
    // Find column indexes
    const acctNumIdx = headers.findIndex((h) =>
      /account\s*number|acct\s*no|code|number/i.test(h)
    );
    const acctNameIdx = headers.findIndex((h) =>
      /account\s*name|name|description/i.test(h)
    );
    const parentNameIdx = headers.findIndex((h) => /parent\s*name|parent/i.test(h));
    const typeIdx = headers.findIndex((h) => /type/i.test(h));
    const subTypeIdx = headers.findIndex((h) => /subtype/i.test(h));
    const levelIdx = headers.findIndex((h) => /level/i.test(h));

    if (acctNumIdx === -1 || acctNameIdx === -1) {
      return NextResponse.json(
        {
          error:
            'CSV must contain "Account Number" and "Account Name" columns.',
        },
        { status: 400 }
      );
    }

    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV split handling quotes
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, '').trim());

      const accountNumber = cleanCols[acctNumIdx];
      const accountName = cleanCols[acctNameIdx];
      const parentName = parentNameIdx !== -1 && cleanCols[parentNameIdx] ? cleanCols[parentNameIdx] : parentNameFromForm;
      const type = typeIdx !== -1 ? cleanCols[typeIdx] : null;
      const subType = subTypeIdx !== -1 ? cleanCols[subTypeIdx] : null;
      const level = levelIdx !== -1 ? parseInt(cleanCols[levelIdx]) || 0 : 0;

      if (!accountNumber || !accountName) continue;

      await prisma.clientChartOfAccounts.upsert({
        where: {
          clientName_accountNumber: {
            clientName,
            accountNumber,
          },
        },
        update: {
          parentName,
          accountName,
          type,
          subType,
          level,
          updatedAt: new Date(),
        },
        create: {
          clientName,
          parentName,
          accountNumber,
          accountName,
          type,
          subType,
          level,
        },
      });
      count++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${count} Chart of Accounts entries for ${clientName}`,
      count,
    });
  } catch (error: any) {
    console.error('Error uploading COA:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}
