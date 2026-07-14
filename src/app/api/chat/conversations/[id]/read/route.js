import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { getMyConversation, otherUserId } from '@/lib/chat';
import { emitToUser } from '@/lib/live';

// POST /api/chat/conversations/[id]/read — mark incoming messages as read
export const POST = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const convo = await getMyConversation(id, me.id);

  const readAt = new Date();
  const [updated] = await db.Message.update(
    { readAt },
    { where: { conversationId: convo.id, senderId: otherUserId(convo, me.id), readAt: null } }
  );

  if (updated > 0) {
    emitToUser(otherUserId(convo, me.id), 'chat:read', {
      conversationId: String(convo.id),
      readerId: String(me.id),
      readAt,
    });
  }
  return ok({ updated });
});
