import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getMyConversation, otherUserId } from '@/lib/chat';
import { emitToUser } from '@/lib/live';

// POST /api/chat/conversations/[id]/typing — { typing } relay a typing
// indicator to the other participant. Ephemeral; nothing is stored.
export const POST = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const convo = await getMyConversation(id, me.id);

  const body = await req.json().catch(() => ({}));
  emitToUser(otherUserId(convo, me.id), 'chat:typing', {
    conversationId: String(convo.id),
    fromUserId: String(me.id),
    typing: !!body?.typing,
  });

  return ok({ ok: true });
});
