import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';

// POST /api/notifications/read — { id? } mark one (or all) as read
export const POST = apiHandler(async (req) => {
  const me = await requireAuth();
  const body = await req.json().catch(() => ({}));
  const where = { userId: me.id, read: false };
  if (body?.id) where.id = body.id;

  await db.Notification.update({ read: true }, { where });
  const unreadCount = await db.Notification.count({ where: { userId: me.id, read: false } });
  return ok({ unreadCount });
});
