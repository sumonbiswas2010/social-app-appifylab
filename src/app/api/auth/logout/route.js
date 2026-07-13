import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { clearAuthCookies } from '@/lib/auth';

export const POST = apiHandler(async () => {
  await clearAuthCookies();
  return ok(null, 'Logged out');
});
