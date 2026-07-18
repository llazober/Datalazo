import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { getDatalazoConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'global' }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'global',
          senderName: 'Luis Lazo',
          senderEmail: 'luis@datalazo.net',
          agencyName: 'Datalazo LLC'
        }
      });
    }

    const config = getDatalazoConfig();

    return NextResponse.json({
      senderName: config.senderName || settings.senderName,
      senderEmail: config.senderEmail || settings.senderEmail,
      agencyName: config.agencyName || settings.agencyName,
      apifyApiKey: config.apifyApiKey || '',
      resendApiKey: config.resendApiKey || '',
      stripeSecretKey: config.stripeSecretKey || '',
      stripeWebhookSecret: config.stripeWebhookSecret || '',
      models: config.models || {
        voiceChat: 'gpt-4o-mini',
        outreach: 'gpt-4o-mini',
        proposal: 'gpt-4o',
        chat: 'gpt-4o-mini',
        seo: 'gpt-4o'
      }
    });
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // 1. Update database settings
    const updatedSettings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: {
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        agencyName: data.agencyName
      },
      create: {
        id: 'global',
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        agencyName: data.agencyName
      }
    });

    // 2. Update datalazo.config.json file
    try {
      const configPath = path.join(process.cwd(), 'datalazo.config.json');
      const newConfig = {
        apifyApiKey: data.apifyApiKey || '',
        resendApiKey: data.resendApiKey || '',
        senderName: data.senderName || '',
        senderEmail: data.senderEmail || '',
        agencyName: data.agencyName || '',
        stripeSecretKey: data.stripeSecretKey || '',
        stripeWebhookSecret: data.stripeWebhookSecret || '',
        models: data.models || {
          voiceChat: 'gpt-4o-mini',
          outreach: 'gpt-4o-mini',
          proposal: 'gpt-4o',
          chat: 'gpt-4o-mini',
          seo: 'gpt-4o'
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
      console.log('Successfully saved changes to datalazo.config.json via Settings form.');
    } catch (err) {
      console.error('Failed to write JSON settings file:', err);
    }

    return NextResponse.json({
      ...updatedSettings,
      apifyApiKey: data.apifyApiKey,
      resendApiKey: data.resendApiKey,
      stripeSecretKey: data.stripeSecretKey,
      stripeWebhookSecret: data.stripeWebhookSecret,
      models: data.models
    });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
