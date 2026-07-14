import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { db } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { cleanString } from '@/lib/validate';
import { cursorWhere } from '@/lib/social';
import { getMyConversation, otherUserId, serializeMessage, conversationPayload } from '@/lib/chat';
import { emitToUser } from '@/lib/live';

// GET /api/chat/conversations/[id]/messages?cursor= — oldest→newest page
export const GET = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const convo = await getMyConversation(id, me.id);

  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit'), 10) || 25, 50);
  const cursor = searchParams.get('cursor');

  const rows = await db.Message.findAll({
    where: { conversationId: convo.id, ...cursorWhere(cursor) },
    order: [['id', 'DESC']],
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return ok({
    messages: page.map(serializeMessage).reverse(),
    nextCursor: hasMore ? String(page[page.length - 1].id) : null,
  });
});

// POST /api/chat/conversations/[id]/messages — { content } send a message
export const POST = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const convo = await getMyConversation(id, me.id);

  const body = await req.json().catch(() => ({}));
  const content = cleanString(body?.content, { field: 'Message', max: 2000 });

  const message = await db.Message.create({
    conversationId: convo.id,
    senderId: me.id,
    content,
  });
  await convo.update({ lastMessageId: message.id, lastMessageAt: message.createdAt });

  const payload = serializeMessage(message);
  const toId = otherUserId(convo, me.id);
  // Recipient gets the conversation snapshot too, so a brand-new chat can
  // open a popup without an extra fetch
  emitToUser(toId, 'chat:message', {
    message: payload,
    conversation: await conversationPayload(convo, toId),
  });
  // Sender's other tabs/devices stay in sync
  emitToUser(me.id, 'chat:message', { message: payload, conversation: null });

  return ok(payload, 'Message sent', 201);
});
