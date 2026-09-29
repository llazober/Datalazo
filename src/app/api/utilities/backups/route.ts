import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

function getS3Client() {
  const accessKeyId = process.env.DO_SPACES_KEY || '';
  const secretAccessKey = process.env.DO_SPACES_SECRET || '';
  const endpoint = process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
  const region = process.env.DO_SPACES_REGION || 'nyc3';

  if (!secretAccessKey) {
    return { client: null, error: 'DO_SPACES_SECRET is missing from environment' };
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
    return { client, error: null };
  } catch (err: any) {
    return { client: null, error: err.message };
  }
}

export async function GET() {
  const bucket = process.env.DO_SPACES_BUCKET || 'datalazocrm';
  const region = process.env.DO_SPACES_REGION || 'nyc3';
  const endpoint = process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';

  const { client, error: s3Error } = getS3Client();

  if (!client) {
    return NextResponse.json({
      status: 'error',
      bucket,
      region,
      endpoint,
      count: 0,
      total_size_mb: 0,
      total_size_formatted: '0 MB',
      error_message: s3Error || 'S3 Client initialization failed',
      backups: [],
    });
  }

  try {
    // List db_backups/
    const command1 = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'db_backups/',
    });
    const res1 = await client.send(command1);
    const contents1 = res1.Contents || [];

    // List root backups
    const command2 = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: '',
    });
    const res2 = await client.send(command2);
    const contents2 = (res2.Contents || []).filter(item => (item.Key || '').includes('_backup_'));

    // Map & dedup
    const map = new Map<string, any>();
    [...contents1, ...contents2].forEach(item => {
      if (item.Key && !item.Key.endsWith('/')) {
        map.set(item.Key, item);
      }
    });

    const allItems = Array.from(map.values()).sort((a, b) => {
      const tA = a.LastModified ? new Date(a.LastModified).getTime() : 0;
      const tB = b.LastModified ? new Date(b.LastModified).getTime() : 0;
      return tB - tA;
    });

    let totalBytes = 0;

    const backups = allItems.map(item => {
      const key = item.Key || '';
      const filename = key.split('/').pop() || key;
      const sizeBytes = item.Size || 0;
      totalBytes += sizeBytes;

      const fileMb = sizeBytes / (1024 * 1024);
      const sizeFormatted = fileMb >= 1.0 ? `${fileMb.toFixed(2)} MB` : `${(sizeBytes / 1024).toFixed(1)} KB`;

      const dbName = filename.includes('_backup_') ? filename.split('_backup_')[0] : 'datalazo';

      let isoTime = '';
      let formattedTime = 'Unknown';

      if (item.LastModified) {
        const d = new Date(item.LastModified);
        isoTime = d.toISOString();
        // US Eastern Time (America/New_York)
        formattedTime = d.toLocaleString('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' ET';
      }

      return {
        key,
        filename,
        database: dbName,
        size_bytes: sizeBytes,
        size_formatted: sizeFormatted,
        last_modified: isoTime,
        last_modified_formatted: formattedTime,
        storage_provider: 'DigitalOcean Spaces (S3)',
        bucket,
        region,
        storage_type: 'Cloud Offsite',
      };
    });

    const totalMb = totalBytes / (1024 * 1024);
    const totalFormatted = totalMb >= 1.0 ? `${totalMb.toFixed(2)} MB` : `${(totalBytes / 1024).toFixed(1)} KB`;

    return NextResponse.json({
      status: 'success',
      bucket,
      region,
      endpoint,
      count: backups.length,
      total_size_mb: Number(totalMb.toFixed(2)),
      total_size_formatted: totalFormatted,
      error_message: null,
      backups,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'partial_error',
      bucket,
      region,
      endpoint,
      count: 0,
      total_size_mb: 0,
      total_size_formatted: '0 MB',
      error_message: `DigitalOcean Spaces query error: ${err.message}`,
      backups: [],
    });
  }
}
