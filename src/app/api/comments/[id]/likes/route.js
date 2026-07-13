import { apiHandler, AppError } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { getVisiblePost, likers } from '@/lib/social';

export const GET = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const comment = await db.Comment.findByPk(id);
  if (!comment) throw new AppError('Comment not found', 404);
  await getVisiblePost(comment.postId, me.id);
  return ok({ users: await likers('comment', comment.id) });
});
