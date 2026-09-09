import { NextResponse } from 'next/server';
import { runDailyBillingJob } from '@/lib/billing-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleJobExecution();
}

export async function POST() {
  return handleJobExecution();
}

async function handleJobExecution() {
  try {
    const result = await runDailyBillingJob();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running daily billing job:', error);
    return NextResponse.json({ status: 'error', error: error.message || 'Failed to run billing job' }, { status: 500 });
  }
}
