import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logins = await prisma.loginLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    return NextResponse.json(logins);
  } catch (error) {
    console.error('Fetch client logins error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
