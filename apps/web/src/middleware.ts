import { NextResponse, type NextRequest } from 'next/server';

// Auth + tenant routing. Edge-runtime middleware: no Node APIs.
//
//   /                  → marketing (allow)
//   /login,/register   → auth (allow, redirect to / if logged in)
//   /[workspace]/*     → workspace shell (require session)
//
// Session presence is detected via httpOnly cookie set by /auth/login.
// Actual verification happens server-side; this is just routing.

const AUTH_FREE = ['/', '/login', '/register', '/pricing', '/api/auth'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthFree = AUTH_FREE.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = req.cookies.has('collab.session');

  if (!isAuthFree && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && (pathname === '/login' || pathname === '/register')) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set('x-request-id', crypto.randomUUID());
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
