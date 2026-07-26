import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch parent-client mappings
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parentName = searchParams.get('parentName') || '';

    const whereCondition = parentName
      ? { parentName: { equals: parentName, mode: 'insensitive' as const } }
      : {};

    const mappings = await prisma.parentClientMap.findMany({
      where: whereCondition,
      orderBy: { parentName: 'asc' },
    });

    return NextResponse.json({ success: true, mappings });
  } catch (error: any) {
    console.error('Error fetching parent-client mappings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch parent-client mappings' },
      { status: 500 }
    );
  }
}

// POST: Add or update a parent-client mapping
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parentName, clientName } = body;

    if (!parentName || !clientName) {
      return NextResponse.json(
        { error: 'parentName and clientName are required.' },
        { status: 400 }
      );
    }

    const mapping = await prisma.parentClientMap.upsert({
      where: {
        parentName_clientName: {
          parentName: parentName.trim(),
          clientName: clientName.trim(),
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        parentName: parentName.trim(),
        clientName: clientName.trim(),
      },
    });

    return NextResponse.json({ success: true, mapping });
  } catch (error: any) {
    console.error('Error creating parent-client mapping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create parent-client mapping' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a parent-client mapping
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Mapping ID is required' }, { status: 400 });
    }

    await prisma.parentClientMap.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Mapping deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting parent-client mapping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete parent-client mapping' },
      { status: 500 }
    );
  }
}
