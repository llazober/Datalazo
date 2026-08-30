import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const backupServerUrl = process.env.BACKUP_SERVER_URL || process.env.NEXT_PUBLIC_BACKUP_APP_URL || 'http://localhost:5050';
  
  try {
    const body = await req.json();
    const { action, dbName, destination = 'local' } = body;

    let targetEndpoint = '';
    let payload = {};

    if (action === 'backup-db') {
      targetEndpoint = '/api/backup/db';
      payload = { dbName: dbName || 'datalazo', destination };
    } else if (action === 'backup-storage') {
      targetEndpoint = '/api/backup/storage';
      payload = { destination };
    } else {
      return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
    }

    const res = await fetch(`${backupServerUrl}${targetEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message || 'Failed to trigger backup on backup engine' 
    }, { status: 500 });
  }
}
