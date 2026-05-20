import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { processDocument } from '@/lib/ai-processor';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, file.name);
    await writeFile(filePath, buffer);

    const type = file.name.split('.').pop()?.toLowerCase() || 'unknown';

    // Save metadata to database
    const document = await prisma.document.create({
      data: {
        name: file.name,
        type: type,
        size: file.size,
        status: 'UPLOADED',
      },
    });

    console.log(`File uploaded and saved: ${file.name} (${document.id})`);

    // Process file immediately based on type
    try {
      if (type === 'txt') {
        const text = buffer.toString('utf-8');
        await processDocument(document.id, text);
      } else if (type === 'pdf') {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await processDocument(document.id, result.text);
      } else if (type === 'docx') {
        const result = await mammoth.extractRawText({ buffer: buffer });
        await processDocument(document.id, result.value);
      }
    } catch (processError) {
      console.error(`Error parsing or processing document ${document.id}:`, processError);
      const errorMessage = processError instanceof Error ? processError.message : 'Unknown processing error';
      await prisma.document.update({
        where: { id: document.id },
        data: { status: `ERROR: ${errorMessage.slice(0, 30)}` },
      });
    }

    // Fetch the updated document state to return
    const updatedDocument = await prisma.document.findUnique({
      where: { id: document.id }
    }) || document;

    return NextResponse.json({ 
      success: true, 
      document: updatedDocument,
      message: 'File uploaded and processing started' 
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
