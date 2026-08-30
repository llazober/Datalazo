import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const backupServerUrl = process.env.BACKUP_SERVER_URL || process.env.NEXT_PUBLIC_BACKUP_APP_URL || 'http://localhost:5050';
  
  try {
    const res = await fetch(`${backupServerUrl}/api/backups/files`, {
      headers: { 'Cache-Control': 'no-cache' },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ files: [], error: `Server returned HTTP ${res.status}` }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ files: [], error: err.message || 'Backup server offline' }, { status: 200 });
  }
}
