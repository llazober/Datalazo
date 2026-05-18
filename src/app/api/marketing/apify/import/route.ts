import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDatalazoConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const datasetId = data.datasetId;
    const config = getDatalazoConfig();
    const apiToken = data.apiToken || config.apifyApiKey || process.env.APIFY_API_KEY;
    const runId = data.runId || null;
    const actorId = data.actorId || null;

    if (!datasetId) {
      return NextResponse.json({ error: 'Apify Dataset ID is required.' }, { status: 400 });
    }

    if (!apiToken) {
      return NextResponse.json({ 
        error: 'Apify API Token is missing. Please provide it or configure APIFY_API_KEY.' 
      }, { status: 400 });
    }

    console.log(`Fetching items from Apify dataset: ${datasetId}`);

    // Fetch dataset items from Apify REST API
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}&clean=true`, {
      method: 'GET',
    });

    if (!datasetResponse.ok) {
      const errText = await datasetResponse.text();
      console.error('Apify Dataset Fetch Error:', errText);
      return NextResponse.json({ error: 'Failed to fetch dataset from Apify.', details: errText }, { status: datasetResponse.status });
    }

    const items = await datasetResponse.json();
    
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Dataset items must be an array.' }, { status: 500 });
    }

    console.log(`Fetched ${items.length} items from Apify. Processing...`);

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      // 1. Extract email (defensive mapping)
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
      } else if (Array.isArray(item.leadsEnrichment) && item.leadsEnrichment.length > 0) {
        for (const lead of item.leadsEnrichment) {
          if (typeof lead.email === 'string' && lead.email.trim()) {
            email = lead.email;
            break;
          }
        }
      }

      email = email.trim().toLowerCase();

      // We only import leads with a valid email (cold outreach needs a contact channel)
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
      } else if (item.contactInfo && typeof item.contactInfo.phone === 'string') {
        phone = item.contactInfo.phone;
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

      // 8. Upsert by Email (prevents duplicate spamming to the same email address)
      await prisma.marketingLead.upsert({
        where: {
          id: `marketing_upsert_${email}_${company.replace(/[^a-zA-Z0-9]/g, '_')}` // custom stable id or use search
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
        // Fallback: If compound ID fails, create a standard model record
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

    console.log(`Import session finished. Imported/Updated: ${importedCount}, Skipped (no email): ${skippedCount}`);

    return NextResponse.json({
      success: true,
      totalCount: items.length,
      importedCount,
      skippedCount
    });
  } catch (error: any) {
    console.error('Import Apify Dataset Error:', error);
    return NextResponse.json({ error: 'Failed to import Apify dataset.', details: error.message }, { status: 500 });
  }
}
