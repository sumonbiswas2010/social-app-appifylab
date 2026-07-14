import { Op } from 'sequelize';
import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { USER_ATTRS, publicUserLite } from '@/lib/social';

// GET /api/chat/users?q= — people you can chat with (everyone but yourself)
export const GET = apiHandler(async (req) => {
  const me = await requireAuth();
  const q = (req.nextUrl.searchParams.get('q') || '').trim();

  const where = { id: { [Op.ne]: me.id } };
  if (q) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${q}%` } },
      { lastName: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const users = await db.User.findAll({
    attributes: USER_ATTRS,
    where,
    order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    limit: 50,
  });
  return ok({ users: users.map(publicUserLite) });
});
