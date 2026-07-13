import { apiHandler, AppError } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { getVisiblePost, toggleLike } from '@/lib/social';

export const POST = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const comment = await db.Comment.findByPk(id);
  if (!comment) throw new AppError('Comment not found', 404);
  await getVisiblePost(comment.postId, me.id);
  const result = await toggleLike(me.id, 'comment', comment);
  return ok(result);
});
