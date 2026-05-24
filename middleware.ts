import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Dashboard routes require authentication
  const isDashboardRoute = pathname.includes('/dashboard');

  // 2. Private Admin API routes require authentication
  let isApiRouteAdminOnly = false;
  if (pathname.startsWith('/api/')) {
    const publicApiPrefixes = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/webhooks/stripe',
      '/api/chat',
      '/api/voice',
      '/api/appointments',
    ];

    const isPublicPrefix = publicApiPrefixes.some(prefix => pathname.startsWith(prefix));

    if (!isPublicPrefix) {
      if (pathname === '/api/lead' && request.method === 'POST') {
        // Public lead capture
        isApiRouteAdminOnly = false;
      } else if (pathname.startsWith('/api/lead/') && request.method === 'GET') {
        // Public lead fetch (e.g., GET /api/lead/[id]) to pre-fill discovery form
        // Make sure it doesn't match nested action endpoints like /api/lead/[id]/proposal
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

  if (isDashboardRoute || isApiRouteAdminOnly) {
    const session = request.cookies.get('admin_session');

    if (!session || session.value !== 'authenticated') {
      console.log('UNAUTHORIZED ACCESS ATTEMPT:', pathname);

      // Return a 401 JSON response for API routes instead of redirecting
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
