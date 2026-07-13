import { Op } from 'sequelize';
import { db } from './models';
import { AppError } from './errors';
import { publicUser } from './auth';

export const USER_ATTRS = ['id', 'firstName', 'lastName', 'avatar'];

// Map of target id -> my reaction type, for annotating lists in one query.
// Map.has() keeps the old boolean "liked" behaviour working.
export async function likedIds(userId, targetType, ids) {
  if (!ids.length) return new Map();
  const rows = await db.Like.findAll({
    attributes: ['targetId', 'type'],
    where: { userId, targetType, targetId: { [Op.in]: ids } },
  });
  return new Map(rows.map((r) => [String(r.targetId), r.type]));
}

// Per-type reaction counts for a set of targets: Map id -> { like: 2, haha: 1 }
export async function reactionCounts(targetType, ids) {
  if (!ids.length) return new Map();
  const rows = await db.Like.findAll({
    attributes: ['targetId', 'type', [db.sequelize.fn('COUNT', '*'), 'count']],
    where: { targetType, targetId: { [Op.in]: ids } },
    group: ['targetId', 'type'],
    raw: true,
  });
  const map = new Map();
  for (const r of rows) {
    const key = String(r.targetId);
    if (!map.has(key)) map.set(key, {});
    map.get(key)[r.type] = Number(r.count);
  }
  return map;
}

// Reacts / switches reaction / un-reacts inside a transaction, keeping the counter in sync.
// Same reaction again = remove; different reaction = switch (count unchanged).
export async function toggleLike(userId, targetType, target, type = 'like') {
  const result = await db.sequelize.transaction(async (t) => {
    const where = { userId, targetType, targetId: target.id };
    const existing = await db.Like.findOne({ where, transaction: t });
    let myReaction;
    if (existing && existing.type === type) {
      await existing.destroy({ transaction: t });
      await target.decrement('likesCount', { transaction: t });
      myReaction = null;
    } else if (existing) {
      await existing.update({ type }, { transaction: t });
      myReaction = type;
    } else {
      await db.Like.create({ ...where, type }, { transaction: t });
      await target.increment('likesCount', { transaction: t });
      myReaction = type;
    }
    await target.reload({ transaction: t });
    return { liked: !!myReaction, myReaction, likesCount: target.likesCount };
  });
  const counts = await reactionCounts(targetType, [target.id]);
  return { ...result, reactions: counts.get(String(target.id)) || {} };
}

export async function likers(targetType, targetId) {
  const rows = await db.Like.findAll({
    where: { targetType, targetId },
    include: [{ association: 'user', attributes: USER_ATTRS }],
    order: [['id', 'DESC']],
    limit: 100,
  });
  return rows.map((r) => ({ ...publicUserLite(r.user), reaction: r.type }));
}

export function publicUserLite(user) {
  return {
    id: String(user.id),
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar || null,
  };
}

// Post visible to viewer? private posts are author-only
export async function getVisiblePost(id, viewerId) {
  const post = await db.Post.findByPk(id);
  if (!post || (post.privacy === 'private' && String(post.userId) !== String(viewerId))) {
    throw new AppError('Post not found', 404);
  }
  return post;
}

export function serializePost(post, viewerId, myReaction, reactions) {
  return {
    id: String(post.id),
    content: post.content,
    imageUrl: post.imageUrl,
    privacy: post.privacy,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    createdAt: post.createdAt,
    user: publicUserLite(post.user),
    isMine: String(post.userId) === String(viewerId),
    likedByMe: !!myReaction,
    myReaction: myReaction || null,
    reactions: reactions || {},
  };
}

export function serializeComment(comment, viewerId, liked) {
  return {
    id: String(comment.id),
    postId: String(comment.postId),
    parentId: comment.parentId ? String(comment.parentId) : null,
    content: comment.content,
    likesCount: comment.likesCount,
    repliesCount: comment.repliesCount,
    createdAt: comment.createdAt,
    user: publicUserLite(comment.user),
    isMine: String(comment.userId) === String(viewerId),
    likedByMe: liked,
  };
}

// Cursor pagination: items ordered by id DESC, cursor = last seen id
export function cursorWhere(cursor) {
  return cursor ? { id: { [Op.lt]: cursor } } : {};
}
