import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`Starting Technical SEO Audit for: ${url}`);

    // Simulate Audit Logic (In production, this would trigger an n8n workflow or a headless crawler)
    const auditResults = {
      url,
      score: Math.floor(Math.random() * 20) + 75, // 75-95 range
      metrics: {
        loadSpeed: (Math.random() * 2 + 0.5).toFixed(2) + 's',
        mobileFriendly: true,
        sslValid: true,
        brokenLinks: Math.floor(Math.random() * 5),
        missingMetaTags: Math.floor(Math.random() * 3)
      },
      timestamp: new Date().toISOString()
    };

    // Save audit summary to DB if needed (Optional: can add an 'Audit' model to Prisma later)
    
    return NextResponse.json(auditResults);
  } catch (error: any) {
    console.error('Audit Error:', error);
    return NextResponse.json({ error: 'Failed to perform audit' }, { status: 500 });
  }
}
