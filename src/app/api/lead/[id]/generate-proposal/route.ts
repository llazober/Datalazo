import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { getDatalazoConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Fetch the lead
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.notes) {
      return NextResponse.json({ error: 'No discovery notes found to generate proposal.' }, { status: 400 });
    }

    // 2. Initialize OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API Key is missing on the server.' }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 3. Generate Proposal
    const prompt = `You are the Senior AI Architect at Datalazo. 
A potential customer named ${lead.name} from ${lead.company || 'their company'} just submitted a discovery questionnaire. 

Here are their answers:
${lead.notes}

Your task: Write a highly professional, compelling 4-paragraph proposal emailing them a custom AI Automation strategy to solve their biggest problems. Explain exactly how Datalazo can help. Keep the tone confident, visionary, and helpful. 
Include placeholder text like "[INSERT PRICING TIER HERE]" so the user knows where to manually add pricing later.
Format it nicely with clean spacing.`;

    const config = getDatalazoConfig();
    const chosenModel = config.models?.proposal || 'gpt-4o';

    const response = await openai.chat.completions.create({
      model: chosenModel,
      messages: [
        { role: 'system', content: 'You are an expert AI sales architect.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    const generatedProposal = response.choices[0].message.content || '';

    // 4. Save to Database
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        aiProposal: generatedProposal
      }
    });

    return NextResponse.json({ success: true, aiProposal: updatedLead.aiProposal });
  } catch (error: any) {
    console.error('Generate Proposal Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate proposal.',
      details: error.message 
    }, { status: 500 });
  }
}
