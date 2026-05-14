import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      }
    });

    console.log('Lead saved to DB:', newLead.id);

    // 2. Notify n8n (Production URL)
    const N8N_WEBHOOK_URL = 'http://161.35.119.223:5678/webhook/lead-capture';
    
    // We send the full newLead object which includes the REAL database ID
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newLead,
        lead_id: newLead.id 
      }),
    })
    .then(res => console.log('n8n Response:', res.status, res.statusText))
    .catch(err => console.error('n8n notification failed, but lead was saved:', err));
    
    return NextResponse.json({ success: true, id: newLead.id });
  } catch (error) {
    console.error('Lead Capture Error:', error);
    return NextResponse.json({ error: 'Failed to capture lead.' }, { status: 500 });
  }
}
