import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const usage = await prisma.tokenUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100 // Last 100 entries
    });

    const totalStats = await prisma.tokenUsage.aggregate({
      _sum: {
        totalTokens: true,
        estimatedCost: true
      }
    });

    const featureStats = await prisma.tokenUsage.groupBy({
      by: ['feature'],
      _sum: {
        totalTokens: true,
        estimatedCost: true
      }
    });

    return NextResponse.json({
      recent: usage,
      totals: {
        tokens: totalStats._sum.totalTokens || 0,
        cost: totalStats._sum.estimatedCost || 0
      },
      byFeature: featureStats
    });
  } catch (error) {
    console.error('Usage Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}
