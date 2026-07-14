import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { USER_ATTRS, cursorWhere } from '@/lib/social';
import { serializeNotification } from '@/lib/notify';

// GET /api/notifications?cursor=&unread= — newest first, plus unread count
export const GET = apiHandler(async (req) => {
  const me = await requireAuth();
  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit'), 10) || 15, 30);
  const cursor = searchParams.get('cursor');
  const unreadOnly = searchParams.get('unread') === '1';

  const [rows, unreadCount] = await Promise.all([
    db.Notification.findAll({
      where: { userId: me.id, ...cursorWhere(cursor), ...(unreadOnly ? { read: false } : {}) },
      include: [{ association: 'actor', attributes: USER_ATTRS }],
      order: [['id', 'DESC']],
      limit: limit + 1,
    }),
    db.Notification.count({ where: { userId: me.id, read: false } }),
  ]);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return ok({
    notifications: page.map(serializeNotification),
    nextCursor: hasMore ? String(page[page.length - 1].id) : null,
    unreadCount,
  });
});
