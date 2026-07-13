import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { AppError } from './errors';
import { db } from './models';

const enc = new TextEncoder();
const ACCESS_SECRET = () => enc.encode(process.env.JWT_ACCESS_SECRET);
const REFRESH_SECRET = () => enc.encode(process.env.JWT_REFRESH_SECRET);

const ACCESS_TTL = '15m';
const REFRESH_TTL_S = 30 * 24 * 60 * 60; // 30 days

async function sign(payload, secret, ttl) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secret);
}

export async function verifyToken(token, type = 'access') {
  const secret = type === 'access' ? ACCESS_SECRET() : REFRESH_SECRET();
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export async function setAuthCookies(user) {
  const accessToken = await sign({ sub: String(user.id) }, ACCESS_SECRET(), ACCESS_TTL);
  const refreshToken = await sign(
    { sub: String(user.id), v: user.tokenVersion },
    REFRESH_SECRET(),
    `${REFRESH_TTL_S}s`
  );
  const base = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_TTL_S, // cookie outlives the JWT so middleware can detect "expired" vs "logged out"
  };
  const store = await cookies();
  store.set('access_token', accessToken, { ...base, path: '/' });
  store.set('refresh_token', refreshToken, { ...base, path: '/api/auth' });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.set('access_token', '', { path: '/', maxAge: 0 });
  store.set('refresh_token', '', { path: '/api/auth', maxAge: 0 });
}

// Returns the authenticated user or throws 401
export async function requireAuth() {
  const store = await cookies();
  const token = store.get('access_token')?.value;
  if (!token) throw new AppError('Unauthorized', 401);
  let payload;
  try {
    payload = await verifyToken(token, 'access');
  } catch {
    throw new AppError('Unauthorized', 401);
  }
  const user = await db.User.findByPk(payload.sub);
  if (!user) throw new AppError('Unauthorized', 401);
  return user;
}

export function publicUser(user) {
  return {
    id: String(user.id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar || null,
  };
}
