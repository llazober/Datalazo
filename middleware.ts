import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin Dashboard routes require admin authentication
  const isAdminDashboardRoute = pathname.startsWith('/dashboard');

  // 2. Client Dashboard routes require client user authentication
  const isClientDashboardRoute = pathname.startsWith('/client/dashboard');

  // 3. Private Admin API routes require admin authentication
  let isApiRouteAdminOnly = false;
  
  // 4. Private Client API routes require client user authentication
  let isApiRouteClientOnly = false;

  if (pathname.startsWith('/api/')) {
    const publicApiPrefixes = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/client-auth/login',
      '/api/client-auth/logout',
      '/api/webhooks/stripe',
      '/api/chat',
      '/api/voice',
      '/api/appointments',
    ];

    const isPublicPrefix = publicApiPrefixes.some(prefix => pathname.startsWith(prefix));

    if (!isPublicPrefix) {
      if (pathname.startsWith('/api/client/')) {
        isApiRouteClientOnly = true;
      } else if (pathname === '/api/lead' && request.method === 'POST') {
        // Public lead capture
        isApiRouteAdminOnly = false;
      } else if (pathname.startsWith('/api/lead/') && request.method === 'GET') {
        // Public lead fetch (e.g., GET /api/lead/[id]) to pre-fill discovery form
        const subpath = pathname.substring('/api/lead/'.length);
        const pathParts = subpath.split('/');
        if (pathParts.length === 1) {
          isApiRouteAdminOnly = false;
        } else {
          isApiRouteAdminOnly = true;
        }
      } else {
        // All other api endpoints are admin-only
        isApiRouteAdminOnly = true;
      }
    }
  }

  // Admin route authentication
  if (isAdminDashboardRoute || isApiRouteAdminOnly) {
    const session = request.cookies.get('admin_session');

    if (!session || session.value !== 'authenticated') {
      console.log('UNAUTHORIZED ADMIN ACCESS ATTEMPT:', pathname);

      if (pathname.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Client route authentication
  if (isClientDashboardRoute || isApiRouteClientOnly) {
    const session = request.cookies.get('client_session');

    if (!session) {
      console.log('UNAUTHORIZED CLIENT ACCESS ATTEMPT:', pathname);

      if (pathname.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const url = request.nextUrl.clone();
      url.pathname = '/client-login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Intercept all paths except static files/images/favicon
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
