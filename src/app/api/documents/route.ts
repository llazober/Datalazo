import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

// GET: List all documents
export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chunks: true }
        }
      }
    });

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error('List Documents Error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// DELETE: Remove a document
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete file from disk
    const filePath = join(process.cwd(), 'public', 'uploads', document.name);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Delete from database (onDelete: Cascade handles chunks)
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('Delete Document Error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
