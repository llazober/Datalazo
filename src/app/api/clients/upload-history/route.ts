import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function cleanRawDescriptionToPattern(rawDesc: string): string {
  if (!rawDesc) return '';
  let text = rawDesc.toUpperCase().trim();

  // Strip dates (e.g., 01/05, 01/06/2026, 01-15-2026)
  text = text.replace(/\b\d{1,2}[/\-]\d{1,2}(?:[/\-]\d{2,4})?\b/g, ' ');

  // Strip card mask / card numbers (e.g., S466005578491206, Card 5646, Card 0758, XXXXXXXXXXXX9107)
  text = text.replace(/\bCard\s*\d+\b/gi, ' ');
  text = text.replace(/\b[A-Z0-9]{12,}\b/g, ' ');
  text = text.replace(/X{3,}\d*/g, ' ');

  // Strip phone numbers and store IDs (# 02, # 1590, 305-2648428, 610-627-1500, 866-5797172)
  text = text.replace(/#\s*\d+/g, ' ');
  text = text.replace(/\b\d{3}[-\s]\d{3}[-\s]\d{4}\b/g, ' ');
  text = text.replace(/\b(?:STORE|ST|NO|UNIT)\s*#?\d+\b/gi, ' ');

  // Strip transaction filler phrases
  const fillers = [
    /\bPURCHASE AUTHORIZED ON\b/gi,
    /\bPURCHASE RETURN AUTHORIZED ON\b/gi,
    /\bRECURRING PAYMENT AUTHORIZED ON\b/gi,
    /\bBUSINESS TO BUSINESS ACH DEBIT\b/gi,
    /\bPURCHASE AUTHORIZED\b/gi,
    /\bPURCHASE\b/gi,
    /\bCHECKCARD\b/gi,
    /\bDEPOSIT\b/gi,
    /\bWITHDRAWAL\b/gi,
    /\bPAYMENT\b/gi,
    /\bEPAYR\b/gi,
    /\bDEBITPMT\b/gi,
    /\bDES:\b/gi,
    /\bID:\b/gi
  ];
  fillers.forEach((f) => {
    text = text.replace(f, ' ');
  });

  // Strip city/state suffixes (MIAMI FL, HIALEAH FL, OPA - LOCKA FL, NORTH MIAMI B FL, PA, CA)
  text = text.replace(/\s+(?:MIAMI|HIALEAH|OPA\s*-\s*LOCKA|NORTH\s*MIAMI(?:\s*B)?)\s+(?:FL|NY|CA|TX|GA|NC|DE|PA)\b/gi, '');
  text = text.replace(/\s+(?:FL|NY|CA|TX|GA|NC|DE|PA)\b/gi, '');

  // Clean non-alphanumeric except & or - or .
  text = text.replace(/[^A-Z0-9\s&\.\-]/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  return text || rawDesc.toUpperCase().trim();
}

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

    if (patternIdx === -1) {
      return NextResponse.json(
        {
          error:
            'CSV must contain a "Description" or "Pattern" column.',
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

      const rawPattern = cleanCols[patternIdx];
      if (!rawPattern) continue;

      // Automatically clean raw bank descriptions to isolated vendor patterns
      const pattern = cleanRawDescriptionToPattern(rawPattern);
      const accountNumber = acctNumIdx !== -1 && cleanCols[acctNumIdx] ? cleanCols[acctNumIdx] : '500';
      const accountName = acctNameIdx !== -1 ? cleanCols[acctNameIdx] : null;
      const transactionType = txTypeIdx !== -1 ? cleanCols[txTypeIdx]?.toUpperCase() || 'ALL' : 'ALL';

      // Ignore generic check lines
      if (pattern === 'CHECK' || pattern === 'DEPOSITED OR CASHED CHECK') continue;

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
