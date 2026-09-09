import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();

    const invoices = await prisma.customerInvoice.findMany({
      where: {
        status: { not: 'CANCELLED' }
      }
    });

    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let countSent = 0;
    let countPaid = 0;
    let countOverdue = 0;

    for (const inv of invoices) {
      totalBilled += inv.totalAmount;
      const isOverdue = inv.status === 'OVERDUE' || (inv.status === 'SENT' && inv.dueDate < today);

      if (inv.status === 'PAID') {
        totalPaid += inv.totalAmount;
        countPaid++;
      } else if (isOverdue) {
        totalOverdue += inv.totalAmount;
        totalOutstanding += inv.totalAmount;
        countOverdue++;
      } else if (inv.status === 'SENT') {
        totalOutstanding += inv.totalAmount;
        countSent++;
      }
    }

    const activeSchedules = await prisma.customerBillingSchedule.findMany({
      where: { status: 'Active' }
    });

    const mrr = activeSchedules.reduce((acc, curr) => acc + curr.billingAmount, 0);
    const activeSubscribers = activeSchedules.length;

    return NextResponse.json({
      total_billed: totalBilled,
      total_paid: totalPaid,
      total_collected: totalPaid,
      total_outstanding: totalOutstanding,
      total_overdue: totalOverdue,
      count_sent: countSent,
      count_paid: countPaid,
      count_overdue: countOverdue,
      mrr: mrr,
      active_subscribers: activeSubscribers,
      active_schedules: activeSubscribers
    });
  } catch (error: any) {
    console.error('Error fetching billing overview:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch overview' }, { status: 500 });
  }
}
