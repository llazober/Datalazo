import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ status: 'error', detail: 'Key query parameter is required' }, { status: 400 });
  }

  const bucket = process.env.DO_SPACES_BUCKET || 'datalazocrm';
  const accessKeyId = process.env.DO_SPACES_KEY || '';
  const secretAccessKey = process.env.DO_SPACES_SECRET || '';
  const endpoint = process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
  const region = process.env.DO_SPACES_REGION || 'nyc3';

  if (!secretAccessKey) {
    return NextResponse.json({ status: 'error', detail: 'DO_SPACES_SECRET environment variable is missing' }, { status: 500 });
  }

  try {
    const client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    const filename = key.split('/').pop() || key;

    return NextResponse.json({
      status: 'success',
      url,
      filename,
      key,
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', detail: `Failed to generate presigned URL: ${err.message}` }, { status: 500 });
  }
}
