import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { apiHandler } from '@/lib/errors';
import { googleAuthUrl } from '@/lib/google';

export const GET = apiHandler(async () => {
  const state = crypto.randomBytes(16).toString('hex');
  const store = await cookies();
  store.set('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth/google',
    maxAge: 600,
  });
  return NextResponse.redirect(googleAuthUrl(state));
});
