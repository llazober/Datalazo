import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const backupServerUrl = process.env.BACKUP_SERVER_URL || process.env.NEXT_PUBLIC_BACKUP_APP_URL || 'http://localhost:5050';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${backupServerUrl}/api/status`, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ 
        online: false, 
        error: `Backup engine returned HTTP ${res.status}`,
        serverUrl: backupServerUrl
      }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ online: true, serverUrl: backupServerUrl, ...data });
  } catch (err: any) {
    return NextResponse.json({ 
      online: false, 
      error: err.name === 'AbortError' ? 'Connection timed out connecting to local backup server' : (err.message || 'Backup server unreachable'),
      serverUrl: backupServerUrl 
    }, { status: 200 }); // Return 200 so client gets clean offline JSON status
  }
}
