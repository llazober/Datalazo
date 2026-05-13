import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { processDocument } from '@/lib/ai-processor';

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

    // If it's a text file, process it immediately in the background
    if (type === 'txt') {
      const text = buffer.toString('utf-8');
      // We don't await this so the user gets a fast response, 
      // but the processing happens in the background.
      processDocument(document.id, text).catch(console.error);
    }

    return NextResponse.json({ 
      success: true, 
      document,
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
