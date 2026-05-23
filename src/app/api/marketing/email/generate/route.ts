import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { getDatalazoConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let leadId: string | null = null;
  try {
    const data = await req.json();
    leadId = data.leadId;
    const config = getDatalazoConfig();
    const { templateId = 'audit', model = 'gpt-4o-mini' } = data;
    const chosenModel = config.models?.outreach || model || 'gpt-4o-mini';

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API Key is missing on the server.' }, { status: 500 });
    }

    // 1. Fetch lead
    const lead = await prisma.marketingLead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    // Update status to generating
    await prisma.marketingLead.update({
      where: { id: leadId },
      data: { status: 'GENERATING' }
    });

    // 2. Setup templates
    let templateInstructions = '';
    if (templateId === 'audit') {
      templateInstructions = `Focus on offering a complimentary, quick "AI Automation Audit" for their business. Explain that we analyzed their profile and found manual workflows in their sector (${lead.category || 'business'}) that could be automated with voice agents or SEO systems. Make the CTA to ask if they'd like a free audit outline.`;
    } else if (templateId === 'pitch') {
      templateInstructions = `Direct value pitch explaining how Datalazo Intelligence builds AI-driven systems (Voice Phone Receptionists, SEO automation, lead pipeline scrapers). Keep the tone technical yet high-yield, focusing on saving 15-20 hours per week of manual staff effort.`;
    } else {
      templateInstructions = `Soft introductory campaign. Reference their category (${lead.category || 'business'}) and location (${lead.address || 'their location'}). Ask if they are accepting new clients and if the owner (${lead.name || 'the manager'}) is open to discussing high-value localized lead streams or automated qualification systems.`;
    }

    // 3. Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 4. Construct Prompt
    const prompt = `You are a world-class B2B Cold Outreach Copywriter at Datalazo Intelligence.
Your task is to write a highly compelling, short, and customized cold email pitch to a business.

Here are the target company details:
- Company Name: ${lead.company || 'their business'}
- Business Category: ${lead.category || 'their industry'}
- Website: ${lead.website || 'Not available'}
- Location/Address: ${lead.address || 'Not available'}
- Contact Name: ${lead.name || 'Owner/Manager'}

Campaign Template Guide: ${templateInstructions}

Strict Guidelines:
1. Subject Line: Keep it under 6 words, highly clickable, curious, and professional. Avoid spam triggers like "Opportunity", "Free", "Double your sales". Make it feel like a standard business inquiry (e.g. "quick question for ${lead.company || 'you'}", "automated systems for ${lead.company || 'your business'}").
2. Email Body: Keep it under 150 words! No long paragraphs. Use short, punchy 1-2 sentence lines with double spacing.
3. Personalization: Explicitly weave in their category (${lead.category || 'niche'}) and website URL if present.
4. Call to Action (CTA): Keep it low-friction. Ask a simple question like: "Do you have 5 minutes this Thursday for a quick ideas exchange?" or "Can I send you a 2-minute custom loom showing how this works?"
5. Return JSON only with "subject" and "body" keys.

Return a JSON object exactly like this:
{
  "subject": "Email subject",
  "body": "Hi [Name] or [Company Team],\\n\\n[Email Body Paragraph 1]\\n\\n[Email Body Paragraph 2]\\n\\nBest regards,\\n[Your Name]\\nDatalazo"
}`;

    // 5. Generate with OpenAI
    const response = await openai.chat.completions.create({
      model: chosenModel,
      messages: [
        { role: 'system', content: 'You are an expert B2B copywriter specializing in cold email outreach. Always reply in clean, valid JSON format matching the requested schema.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.75,
    });

    const contentText = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(contentText);

    const subject = parsed.subject || `Question for ${lead.company || 'the team'}`;
    const body = parsed.body || '';

    // 6. Save back to database
    const updatedLead = await prisma.marketingLead.update({
      where: { id: leadId },
      data: {
        aiSubject: subject,
        aiBody: body,
        status: 'DRAFT_READY'
      }
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead
    });
  } catch (error: any) {
    console.error('AI Outreach Generation Error:', error);
    
    // Reset status to NEW if generation failed
    if (leadId) {
      await prisma.marketingLead.update({
        where: { id: leadId },
        data: { status: 'NEW' }
      }).catch(() => {});
    }

    return NextResponse.json({ 
      error: 'Failed to generate AI cold email draft.',
      details: error.message 
    }, { status: 500 });
  }
}
