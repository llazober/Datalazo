import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // AGGRESSIVE CHECK: Protect all dashboard routes
  if (pathname.includes('/dashboard')) {
    const session = request.cookies.get('admin_session');

    if (!session || session.value !== 'authenticated') {
      console.log('UNAUTHORIZED ACCESS ATTEMPT:', pathname);
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// No matcher - check every request for maximum reliability
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
