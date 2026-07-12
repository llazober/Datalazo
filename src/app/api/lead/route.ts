import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDatalazoConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // 1. Save directly to the Database
    let newLead;
    if (data.leadId) {
      newLead = await prisma.lead.update({
        where: { id: data.leadId },
        data: {
          name: data.name,
          email: data.email,
          company: data.company,
          service: data.service,
          message: data.message,
          phone: data.phone,
          notes: data.notes,
          status: data.status || 'IN_REVIEW',
        }
      });
      console.log('Lead updated in DB:', newLead.id);
    } else {
      newLead = await prisma.lead.create({
        data: {
          name: data.name,
          email: data.email,
          company: data.company,
          service: data.service,
          message: data.message,
          phone: data.phone,
          notes: data.notes,
          status: data.status || 'CONTACTED',
        }
      });
      console.log('Lead saved to DB:', newLead.id);
    }

    // 1.5. Send email notification to luislazo@datalazo.net
    const config = getDatalazoConfig();
    const resendKey = config.resendApiKey || process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
        
        const isDiscovery = data.service === 'AI Discovery Questionnaire' || data.status === 'IN_REVIEW';
        const subject = isDiscovery 
          ? `🚨 New AI Discovery Questionnaire: ${newLead.name}` 
          : `📥 New Lead Captured: ${newLead.name}`;
          
        const fromAddress = settings?.senderEmail 
          ? `${settings.senderName || 'Datalazo'} <${settings.senderEmail}>`
          : config.senderEmail
            ? `${config.senderName || 'Datalazo'} <${config.senderEmail}>`
            : 'Datalazo Intelligence <luis@datalazo.net>';

        await resend.emails.send({
          from: fromAddress,
          to: 'luislazo@datalazo.net',
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #06b6d4; border-bottom: 2px solid #06b6d4; padding-bottom: 10px; margin-top: 0;">
                ${isDiscovery ? 'AI Discovery Profile Submission' : 'New Lead Contact Details'}
              </h2>
              
              <p><strong>Name:</strong> ${newLead.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${newLead.email}">${newLead.email}</a></p>
              <p><strong>Phone:</strong> ${newLead.phone || 'N/A'}</p>
              <p><strong>Company:</strong> ${newLead.company || 'N/A'}</p>
              <p><strong>Service Focus:</strong> ${newLead.service || 'N/A'}</p>
              <p><strong>Status:</strong> ${newLead.status}</p>
              
              ${newLead.message ? `<div style="background-color: #f8fafc; padding: 15px; margin: 15px 0; border-radius: 4px; border-left: 4px solid #cbd5e1;"><strong>Message:</strong><br/><em>${newLead.message}</em></div>` : ''}
              
              ${newLead.notes ? `<div style="background-color: #f0fdfa; padding: 15px; margin: 15px 0; border-radius: 4px; border-left: 4px solid #0d9488; font-family: monospace; white-space: pre-wrap; font-size: 13px;"><strong>Discovery Questionnaire:</strong><br/>${newLead.notes}</div>` : ''}
              
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #999; text-align: center;">Datalazo Intelligence Lead Capture</p>
            </div>
          `
        });
        console.log('Office notification email sent for lead submission/update.');
      } catch (emailErr) {
        console.error('Failed to send lead email notification:', emailErr);
      }
    }

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

    
    return NextResponse.json({ success: true, id: newLead.id, lead: newLead });
  } catch (error) {
    console.error('Lead Capture Error:', error);
    return NextResponse.json({ error: 'Failed to capture lead.' }, { status: 500 });
  }
}
