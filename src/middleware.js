import { NextResponse } from 'next/server';
import { jwtVerify, errors } from 'jose';

const AUTH_PAGES = ['/login', '/register'];

async function accessState(req) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return 'none';
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_ACCESS_SECRET));
    return 'valid';
  } catch (e) {
    // cookie outlives the JWT, so an expired token means "refreshable session"
    return e instanceof errors.JWTExpired ? 'expired' : 'none';
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // APIs are same-app only: block cross-origin mutations, never emit CORS headers
  if (pathname.startsWith('/api')) {
    const origin = req.headers.get('origin');
    if (origin && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin !== req.nextUrl.origin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.next();
  }

  const state = await accessState(req);

  if (AUTH_PAGES.includes(pathname)) {
    if (state === 'valid') return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  if (state === 'valid') return NextResponse.next();
  if (state === 'expired') {
    const url = new URL('/api/auth/refresh', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/', '/login', '/register', '/api/:path*'],
};
