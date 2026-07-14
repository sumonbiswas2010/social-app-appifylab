import { Op } from 'sequelize';
import { db } from './models';
import { publicUserLite } from './social';
import { emitToUser } from './live';

export function serializeNotification(n) {
  return {
    id: String(n.id),
    type: n.type,
    postId: n.postId ? String(n.postId) : null,
    read: n.read,
    createdAt: n.createdAt,
    actor: n.actor ? publicUserLite(n.actor) : null,
  };
}

// Fan out a "new public post" notification to every other user: one bulk
// insert, then a realtime emit per recipient. Callers should treat this as
// best-effort (never fail the post request over it).
export async function notifyNewPost(post, author) {
  const users = await db.User.findAll({
    attributes: ['id'],
    where: { id: { [Op.ne]: author.id } },
    raw: true,
  });
  if (!users.length) return;

  const rows = await db.Notification.bulkCreate(
    users.map((u) => ({ userId: u.id, actorId: author.id, type: 'post', postId: post.id })),
    { returning: true }
  );

  for (const n of rows) {
    n.actor = author;
    emitToUser(n.userId, 'notification:new', serializeNotification(n));
  }
}
