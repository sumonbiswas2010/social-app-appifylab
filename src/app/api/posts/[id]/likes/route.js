import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getVisiblePost, likers } from '@/lib/social';

export const GET = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const post = await getVisiblePost(id, me.id);
  return ok({ users: await likers('post', post.id) });
});
