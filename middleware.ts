import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('admin_auth');
  const { pathname } = request.nextUrl;

  // Allow access to login page
  if (pathname === '/login') {
    if (authCookie?.value === 'true') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (pathname.startsWith('/products') || pathname.startsWith('/categories') || pathname.startsWith('/feedback') || pathname === '/') {
    if (authCookie?.value !== 'true') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/products/:path*', '/categories/:path*', '/feedback/:path*', '/login'],
};
