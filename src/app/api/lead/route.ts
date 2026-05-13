import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Save directly to the Database (Guaranteed to work)
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
    
    // We use a "fire and forget" approach so n8n issues don't stop the user
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead),
    })
    .then(res => console.log('n8n Response:', res.status, res.statusText))
    .catch(err => console.error('n8n notification failed, but lead was saved:', err));
    

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead Capture Error:', error);
    return NextResponse.json({ error: 'Failed to capture lead.' }, { status: 500 });
  }
}
