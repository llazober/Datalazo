import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Save directly to the Database
    const newLead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company,
        service: data.service,
        message: data.message,
        status: 'CONTACTED',
      }

    });

    console.log('Lead saved to DB:', newLead.id);

    // 2. Notify n8n
    // Fallback for different naming conventions in Easypanel (WEBHOOK_URL, N8N_WEBHOOK_URL, etc.)
    const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_UR || process.env.WEBHOOK_URL || '';
    
    if (webhookUrl) {
      console.log('Notifying n8n at:', webhookUrl);
      try {
        const n8nResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newLead,
            lead_id: newLead.id 
          }),
        });
        console.log('n8n Response Status:', n8nResponse.status);
      } catch (err) {
        console.error('n8n notification failed:', err);
      }
    } else {
      console.warn('N8N_WEBHOOK_URL is not defined in environment variables.');
    }

    
    return NextResponse.json({ success: true, id: newLead.id });
  } catch (error) {
    console.error('Lead Capture Error:', error);
    return NextResponse.json({ error: 'Failed to capture lead.' }, { status: 500 });
  }
}
