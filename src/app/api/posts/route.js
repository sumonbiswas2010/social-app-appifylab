import { Op } from 'sequelize';
import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/r2';
import { cleanString, assert } from '@/lib/validate';
import { USER_ATTRS, likedIds, reactionCounts, serializePost, cursorWhere } from '@/lib/social';

// GET /api/posts?cursor=&limit= — newest first, public + own private
export const GET = apiHandler(async (req) => {
  const me = await requireAuth();
  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit'), 10) || 10, 30);
  const cursor = searchParams.get('cursor');

  const posts = await db.Post.findAll({
    where: {
      ...cursorWhere(cursor),
      [Op.or]: [{ privacy: 'public' }, { userId: me.id }],
    },
    include: [{ association: 'user', attributes: USER_ATTRS }],
    order: [['id', 'DESC']],
    limit: limit + 1,
  });

  const hasMore = posts.length > limit;
  const page = posts.slice(0, limit);
  const ids = page.map((p) => p.id);
  const [mine, reactions] = await Promise.all([
    likedIds(me.id, 'post', ids),
    reactionCounts('post', ids),
  ]);
  return ok({
    posts: page.map((p) =>
      serializePost(p, me.id, mine.get(String(p.id)) || null, reactions.get(String(p.id)) || {})
    ),
    nextCursor: hasMore ? String(page[page.length - 1].id) : null,
  });
});

// POST /api/posts — multipart: content, privacy, image?
export const POST = apiHandler(async (req) => {
  const me = await requireAuth();
  const form = await req.formData();
  const content = cleanString(form.get('content'), { field: 'Post text', max: 5000, required: false });
  const privacy = form.get('privacy') === 'private' ? 'private' : 'public';
  const image = form.get('image');
  const hasImage = image && typeof image === 'object' && image.size > 0;
  assert(content || hasImage, 'Post cannot be empty');

  const imageUrl = hasImage ? await uploadImage(image) : null;
  const post = await db.Post.create({ userId: me.id, content, imageUrl, privacy });
  post.user = me;
  return ok(serializePost(post, me.id, null, {}), 'Post created', 201);
});
