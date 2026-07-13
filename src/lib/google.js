import { AppError } from './errors';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export function redirectUri() {
  return `${process.env.APP_URL}/api/auth/google/callback`;
}

export function googleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return `${AUTH_URL}?${params}`;
}

// Exchanges the auth code and returns the Google profile from the id_token
export async function googleProfile(code) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.id_token) throw new AppError('Google authentication failed', 401);
  // id_token comes straight from Google over TLS, safe to decode without signature check
  const payload = JSON.parse(Buffer.from(data.id_token.split('.')[1], 'base64url').toString());
  if (!payload.sub || !payload.email) throw new AppError('Google authentication failed', 401);
  return payload;
}
