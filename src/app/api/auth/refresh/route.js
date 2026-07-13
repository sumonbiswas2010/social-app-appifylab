import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiHandler, AppError } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { verifyToken, setAuthCookies, clearAuthCookies } from '@/lib/auth';

async function rotate() {
  const store = await cookies();
  const token = store.get('refresh_token')?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token, 'refresh');
    const user = await db.User.findByPk(payload.sub);
    if (!user || user.tokenVersion !== payload.v) return null;
    await setAuthCookies(user);
    return user;
  } catch {
    return null;
  }
}

// Called by apiCall when the access token expires
export const POST = apiHandler(async () => {
  const user = await rotate();
  if (!user) {
    await clearAuthCookies();
    throw new AppError('Session expired', 401);
  }
  return ok(null, 'Refreshed');
});

// Called by middleware redirects for page navigations
export const GET = apiHandler(async (req) => {
  const nextParam = req.nextUrl.searchParams.get('next') || '/';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';
  const user = await rotate();
  if (!user) {
    await clearAuthCookies();
    return NextResponse.redirect(new URL('/login', process.env.APP_URL));
  }
  return NextResponse.redirect(new URL(next, process.env.APP_URL));
});
