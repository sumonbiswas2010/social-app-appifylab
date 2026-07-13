import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { cleanString } from '@/lib/validate';
import { USER_ATTRS, likedIds, serializeComment, getVisiblePost, cursorWhere } from '@/lib/social';

// GET /api/posts/[id]/comments?cursor=&limit= — top-level comments, newest first
export const GET = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const post = await getVisiblePost(id, me.id);
  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit'), 10) || 5, 30);

  const comments = await db.Comment.findAll({
    where: { ...cursorWhere(searchParams.get('cursor')), postId: post.id, parentId: null },
    include: [{ association: 'user', attributes: USER_ATTRS }],
    order: [['id', 'DESC']],
    limit: limit + 1,
  });

  const hasMore = comments.length > limit;
  const page = comments.slice(0, limit);
  const liked = await likedIds(me.id, 'comment', page.map((c) => c.id));
  return ok({
    comments: page.map((c) => serializeComment(c, me.id, liked.has(String(c.id)))),
    nextCursor: hasMore ? String(page[page.length - 1].id) : null,
  });
});

// POST /api/posts/[id]/comments — { content }
export const POST = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const post = await getVisiblePost(id, me.id);
  const body = await req.json();
  const content = cleanString(body.content, { field: 'Comment', max: 2000 });

  const comment = await db.sequelize.transaction(async (t) => {
    const created = await db.Comment.create(
      { postId: post.id, userId: me.id, content },
      { transaction: t }
    );
    await post.increment('commentsCount', { transaction: t });
    return created;
  });
  comment.user = me;
  return ok(serializeComment(comment, me.id, false), 'Comment added', 201);
});
