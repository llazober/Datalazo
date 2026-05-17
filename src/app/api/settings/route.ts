import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'global' }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'global',
          senderName: 'Luis Lazo',
          senderEmail: 'luis@datalazo.net',
          agencyName: 'Datalazo Intelligence'
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const updatedSettings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: {
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        agencyName: data.agencyName
      },
      create: {
        id: 'global',
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        agencyName: data.agencyName
      }
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
