import { apiHandler, AppError } from '@/lib/errors';
import { ok } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getVisiblePost } from '@/lib/social';

export const DELETE = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const post = await getVisiblePost(id, me.id);
  if (String(post.userId) !== String(me.id)) throw new AppError('Forbidden', 403);
  await post.destroy();
  return ok(null, 'Post deleted');
});
