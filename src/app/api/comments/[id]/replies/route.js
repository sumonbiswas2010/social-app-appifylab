import { apiHandler, AppError } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { cleanString } from '@/lib/validate';
import { USER_ATTRS, likedIds, serializeComment, getVisiblePost } from '@/lib/social';

async function getParent(id, viewerId) {
  const parent = await db.Comment.findByPk(id);
  if (!parent || parent.parentId) throw new AppError('Comment not found', 404);
  await getVisiblePost(parent.postId, viewerId); // enforces post visibility
  return parent;
}

// GET /api/comments/[id]/replies — oldest first
export const GET = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const parent = await getParent(id, me.id);

  const replies = await db.Comment.findAll({
    where: { parentId: parent.id },
    include: [{ association: 'user', attributes: USER_ATTRS }],
    order: [['id', 'ASC']],
    limit: 100,
  });
  const liked = await likedIds(me.id, 'comment', replies.map((r) => r.id));
  return ok({ replies: replies.map((r) => serializeComment(r, me.id, liked.has(String(r.id)))) });
});

// POST /api/comments/[id]/replies — { content }
export const POST = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const parent = await getParent(id, me.id);
  const body = await req.json();
  const content = cleanString(body.content, { field: 'Reply', max: 2000 });

  const reply = await db.sequelize.transaction(async (t) => {
    const created = await db.Comment.create(
      { postId: parent.postId, userId: me.id, parentId: parent.id, content },
      { transaction: t }
    );
    await parent.increment('repliesCount', { transaction: t });
    await db.Post.increment('commentsCount', { where: { id: parent.postId }, transaction: t });
    return created;
  });
  reply.user = me;
  return ok(serializeComment(reply, me.id, false), 'Reply added', 201);
});
