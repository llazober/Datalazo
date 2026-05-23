import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { getDatalazoConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

// SAVE DRAFT
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { aiProposal } = await req.json();

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { aiProposal }
    });

    return NextResponse.json({ success: true, aiProposal: updatedLead.aiProposal });
  } catch (error: any) {
    console.error('Save Proposal Error:', error);
    return NextResponse.json({ error: 'Failed to save proposal draft.' }, { status: 500 });
  }
}

// APPROVE & SEND
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { aiProposal } = await req.json();

    // 1. Save final version and update status
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { 
        aiProposal,
        status: 'PROCESSED' // Mark as sent!
      }
    });

    // 2. Fetch Global Settings
    const config = getDatalazoConfig();
    const resendKey = config.resendApiKey || process.env.RESEND_API_KEY;
    
    let settings = await prisma.settings.findUnique({ where: { id: 'global' } });
    const fromAddress = settings?.senderEmail 
      ? `${settings.senderName || 'Datalazo'} <${settings.senderEmail}>`
      : config.senderEmail
        ? `${config.senderName || 'Datalazo'} <${config.senderEmail}>`
        : 'Datalazo Intelligence <luis@datalazo.net>';

    // 3. Send the email using Resend (Preferred) or n8n (Fallback)
    if (resendKey) {
      const resend = new Resend(resendKey);
      
      const { data, error } = await resend.emails.send({
        from: fromAddress, // Uses Settings from DB
        to: updatedLead.email,
        subject: 'Your Custom AI Automation Roadmap from Datalazo',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hi ${updatedLead.name},</p>
            <p>Thank you for submitting your Discovery Questionnaire. Based on your answers, I have put together a custom AI roadmap for ${updatedLead.company || 'your business'}.</p>
            <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #06b6d4; margin: 20px 0;">
              ${aiProposal.replace(/\n/g, '<br/>')}
            </div>
            <p>If you have any questions or want to move forward, just reply to this email!</p>
            <p>Best regards,<br/><strong>${settings?.senderName || 'Luis Lazo'}</strong><br/>${settings?.agencyName || 'Datalazo Intelligence'}</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend Error:', error);
        return NextResponse.json({ error: 'Failed to send via Resend', details: error }, { status: 500 });
      }
      console.log('Email sent via Resend:', data);
    } 
    // Fallback to n8n Webhook
    else {
      const webhookUrl = process.env.N8N_PROPOSAL_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || '';
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'SEND_PROPOSAL',
            leadId: updatedLead.id,
            name: updatedLead.name,
            email: updatedLead.email,
            proposalText: updatedLead.aiProposal
          }),
        });
      }
    }

    return NextResponse.json({ success: true, status: updatedLead.status });
  } catch (error: any) {
    console.error('Send Proposal Error:', error);
    return NextResponse.json({ error: 'Failed to send proposal.' }, { status: 500 });
  }
}
