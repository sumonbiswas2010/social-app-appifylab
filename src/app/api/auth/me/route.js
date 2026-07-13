import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { requireAuth, publicUser } from '@/lib/auth';

export const GET = apiHandler(async () => {
  const user = await requireAuth();
  return ok(publicUser(user));
});
