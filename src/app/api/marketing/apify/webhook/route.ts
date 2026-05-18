import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log('Received Webhook call from Apify:', JSON.stringify(payload, null, 2));

    // Apify webhook events: RUN.SUCCEEDED is the one we care about
    const event = payload.eventType || payload.event;

    // Handle Apify webhook test event gracefully
    if (event === 'Test' || event === 'test') {
      console.log('Apify test webhook received and verified successfully.');
      return NextResponse.json({ success: true, message: 'Webhook connection active!' });
    }

    const resource = payload.resource;

    if (!resource || !resource.defaultDatasetId) {
      console.warn('Webhook received but defaultDatasetId is missing in payload resource.');
      return NextResponse.json({ success: false, error: 'defaultDatasetId is missing.' }, { status: 400 });
    }

    const datasetId = resource.defaultDatasetId;
    const runId = resource.id || null;
    const actorId = resource.actId || null;
    
    // We fetch the API key from environment
    const apiToken = process.env.APIFY_API_KEY;

    if (!apiToken) {
      console.error('APIFY_API_KEY is not defined in server environment variables. Webhook failed to process.');
      return NextResponse.json({ success: false, error: 'Server is missing APIFY_API_KEY environment variable.' }, { status: 500 });
    }

    console.log(`Webhook triggering automatic import for dataset ${datasetId} (run: ${runId})`);

    // Call our internal dataset fetch logic
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}&clean=true`, {
      method: 'GET',
    });

    if (!datasetResponse.ok) {
      const errText = await datasetResponse.text();
      console.error(`Failed to fetch dataset in webhook:`, errText);
      return NextResponse.json({ success: false, error: 'Failed to fetch dataset items.', details: errText }, { status: 500 });
    }

    const items = await datasetResponse.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Dataset items are not an array.' }, { status: 400 });
    }

    console.log(`Webhook processing ${items.length} items from dataset ${datasetId}...`);

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      // 1. Extract email
      let email = '';
      if (typeof item.email === 'string') {
        email = item.email;
      } else if (Array.isArray(item.emails) && item.emails.length > 0) {
        email = item.emails[0];
      } else if (typeof item.contactEmail === 'string') {
        email = item.contactEmail;
      } else if (Array.isArray(item.contactEmails) && item.contactEmails.length > 0) {
        email = item.contactEmails[0];
      } else if (item.contactInfo && typeof item.contactInfo.email === 'string') {
        email = item.contactInfo.email;
      } else if (item.contactInfo && Array.isArray(item.contactInfo.emails) && item.contactInfo.emails.length > 0) {
        email = item.contactInfo.emails[0];
      }

      email = email.trim().toLowerCase();

      // Only import leads with a valid email
      if (!email || !email.includes('@')) {
        skippedCount++;
        continue;
      }

      // 2. Extract Phone
      let phone = '';
      if (typeof item.phone === 'string') {
        phone = item.phone;
      } else if (typeof item.phoneNumber === 'string') {
        phone = item.phoneNumber;
      } else if (Array.isArray(item.phones) && item.phones.length > 0) {
        phone = item.phones[0];
      }

      // 3. Extract Company Name
      const company = item.title || item.name || item.companyName || 'Unknown Business';

      // 4. Extract Website
      const website = item.website || item.url || item.websiteUrl || null;

      // 5. Extract Address
      const address = item.address || item.fullAddress || item.streetAddress || null;

      // 6. Extract Category
      const category = item.categoryName || item.subTitle || item.category || item.type || null;

      // 7. Extract Contact Person Name
      const name = item.contactPerson || item.ownerName || item.managerName || null;

      // 8. Upsert into database
      await prisma.marketingLead.upsert({
        where: {
          id: `marketing_upsert_${email}_${company.replace(/[^a-zA-Z0-9]/g, '_')}`
        },
        create: {
          name,
          email,
          phone,
          company,
          website,
          address,
          category,
          status: 'NEW',
          apifyRunId: runId,
          apifyActorId: actorId,
        },
        update: {
          phone: phone || undefined,
          website: website || undefined,
          address: address || undefined,
          category: category || undefined,
        }
      }).catch(async () => {
        // Fallback: create normal record
        await prisma.marketingLead.create({
          data: {
            name,
            email,
            phone,
            company,
            website,
            address,
            category,
            status: 'NEW',
            apifyRunId: runId,
            apifyActorId: actorId,
          }
        });
      });

      importedCount++;
    }

    console.log(`Webhook sync successful! Ingested/Updated: ${importedCount}, Skipped: ${skippedCount}`);

    return NextResponse.json({
      success: true,
      event,
      datasetId,
      importedCount,
      skippedCount
    });
  } catch (error: any) {
    console.error('Apify Webhook Processing Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process webhook.', details: error.message }, { status: 500 });
  }
}
