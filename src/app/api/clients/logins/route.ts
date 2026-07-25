import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [clientUserLogins, loginLogs] = await Promise.all([
      prisma.clientUserLogin.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: {
            include: {
              client: true
            }
          }
        }
      }),
      prisma.loginLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ]);

    const formattedClientLogins = clientUserLogins.map((item) => ({
      id: item.id,
      site: item.user?.client?.company || item.user?.client?.name || 'Client Portal',
      username: item.user?.username || 'Unknown User',
      ipAddress: item.ip || 'Unknown IP',
      userAgent: item.userAgent || 'Unknown User Agent',
      createdAt: item.createdAt
    }));

    const formattedLoginLogs = loginLogs.map((item) => ({
      id: `log-${item.id}`,
      site: item.site || 'N/A',
      username: item.username || 'Unknown',
      ipAddress: item.ipAddress || 'Unknown',
      userAgent: item.userAgent || 'Unknown',
      createdAt: item.createdAt
    }));

    // Combine and sort by createdAt descending
    const combined = [...formattedClientLogins, ...formattedLoginLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(combined.slice(0, 100));
  } catch (error) {
    console.error('Fetch client logins error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
