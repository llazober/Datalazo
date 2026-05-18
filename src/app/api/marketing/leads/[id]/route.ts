import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const updatedLead = await prisma.marketingLead.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        company: data.company !== undefined ? data.company : undefined,
        website: data.website !== undefined ? data.website : undefined,
        address: data.address !== undefined ? data.address : undefined,
        category: data.category !== undefined ? data.category : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        status: data.status !== undefined ? data.status : undefined,
        aiSubject: data.aiSubject !== undefined ? data.aiSubject : undefined,
        aiBody: data.aiBody !== undefined ? data.aiBody : undefined,
      },
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    console.error('Update Marketing Lead Error:', error);
    return NextResponse.json({ error: 'Failed to update marketing lead.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.marketingLead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    console.error('Delete Marketing Lead Error:', error);
    return NextResponse.json({ error: 'Failed to delete marketing lead.' }, { status: 500 });
  }
}
