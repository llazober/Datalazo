import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const actorId = data.actorId || '2Mdma1N6Fd0y3QEjR';
    const queries = data.queries || [];
    const limit = data.limit || 20;
    const apiToken = data.apiToken || process.env.APIFY_API_KEY;

    if (!apiToken) {
      return NextResponse.json({ 
        error: 'Apify API Token is missing. Provide it in the request or set APIFY_API_KEY in the environment.' 
      }, { status: 400 });
    }

    if (queries.length === 0) {
      return NextResponse.json({ error: 'At least one search query is required.' }, { status: 400 });
    }

    // Configure scraper input for Google Maps Scraper (apify/google-maps-scraper)
    const scraperInput = {
      searchStringsArray: queries,
      maxCrawledPlacesPerSearch: limit,
      exportPlaceUrls: false,
      includeReviews: false,
      includeImages: false,
      includePeople: true, // Try to find emails/socials/phones if supported
      scrapeWebsite: true, // Scrapes emails from websites!
      personalData: true,  // Enables email and social link extraction!
      scrapeContacts: true, // MUST be true in latest Compass version to scrape emails!
      scrapeSocialMediaProfiles: {
        facebooks: true,
        instagrams: true,
        youtubes: true,
        tiktoks: true,
        twitters: true
      },
      maximumLeadsEnrichmentRecords: 10,
      verifyLeadsEnrichmentEmails: true,
    };

    console.log(`Triggering Apify Actor ${actorId} with queries:`, queries);

    const apifyResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scraperInput),
    });

    if (!apifyResponse.ok) {
      const errText = await apifyResponse.text();
      console.error('Apify Trigger Error:', errText);
      return NextResponse.json({ error: 'Failed to trigger scraper on Apify.', details: errText }, { status: apifyResponse.status });
    }

    const runData = await apifyResponse.json();
    
    return NextResponse.json({ 
      success: true, 
      runId: runData.data.id,
      datasetId: runData.data.defaultDatasetId,
      status: runData.data.status,
    });
  } catch (error: any) {
    console.error('Trigger Apify Error:', error);
    return NextResponse.json({ error: 'Failed to trigger Apify scraper.', details: error.message }, { status: 500 });
  }
}
