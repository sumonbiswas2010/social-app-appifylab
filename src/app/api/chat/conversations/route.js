import { Op } from 'sequelize';
import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { USER_ATTRS } from '@/lib/social';
import {
  getOrCreateConversation,
  serializeConversation,
  unreadCounts,
  conversationPayload,
} from '@/lib/chat';

// GET /api/chat/conversations — my conversations, most recent activity first
export const GET = apiHandler(async () => {
  const me = await requireAuth();

  const convos = await db.Conversation.findAll({
    where: { [Op.or]: [{ userOneId: me.id }, { userTwoId: me.id }] },
    include: [
      { association: 'userOne', attributes: USER_ATTRS },
      { association: 'userTwo', attributes: USER_ATTRS },
      { association: 'lastMessage' },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 50,
  });

  const unread = await unreadCounts(me.id, convos.map((c) => c.id));
  return ok({
    conversations: convos.map((c) =>
      serializeConversation(c, me.id, {
        otherUser: String(c.userOneId) === String(me.id) ? c.userTwo : c.userOne,
        lastMessage: c.lastMessage,
        unreadCount: unread.get(String(c.id)) || 0,
      })
    ),
    totalUnread: [...unread.values()].reduce((a, b) => a + b, 0),
  });
});

// POST /api/chat/conversations — { userId } find or start a chat with someone
export const POST = apiHandler(async (req) => {
  const me = await requireAuth();
  const body = await req.json().catch(() => ({}));
  const convo = await getOrCreateConversation(me.id, body?.userId);
  return ok(await conversationPayload(convo, me.id), 'OK', 201);
});
