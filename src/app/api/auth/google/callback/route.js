import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiHandler } from '@/lib/errors';
import { googleProfile } from '@/lib/google';
import { db } from '@/lib/models';
import { setAuthCookies } from '@/lib/auth';

export const GET = apiHandler(async (req) => {
  const { searchParams } = req.nextUrl;
  const store = await cookies();
  const savedState = store.get('oauth_state')?.value;
  store.set('oauth_state', '', { path: '/api/auth/google', maxAge: 0 });

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const loginUrl = new URL('/login?error=google', process.env.APP_URL);
  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(loginUrl);
  }

  let profile;
  try {
    profile = await googleProfile(code);
  } catch {
    return NextResponse.redirect(loginUrl);
  }

  const email = profile.email.toLowerCase();
  let user = await db.User.findOne({ where: { googleId: profile.sub } });
  if (!user) {
    user = await db.User.findOne({ where: { email } });
    if (user) {
      await user.update({ googleId: profile.sub, avatar: user.avatar || profile.picture || null });
    } else {
      user = await db.User.create({
        firstName: profile.given_name || 'User',
        lastName: profile.family_name || '',
        email,
        googleId: profile.sub,
        avatar: profile.picture || null,
      });
    }
  }

  await setAuthCookies(user);
  return NextResponse.redirect(new URL('/', process.env.APP_URL));
});
