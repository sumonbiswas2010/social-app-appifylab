import { Op } from 'sequelize';
import { db } from './models';
import { AppError } from './errors';
import { USER_ATTRS, publicUserLite } from './social';

// The pair is stored ordered so (a,b) and (b,a) hit the same unique row
function orderedPair(a, b) {
  const x = BigInt(a);
  const y = BigInt(b);
  return x < y ? [String(x), String(y)] : [String(y), String(x)];
}

export async function getOrCreateConversation(meId, otherId) {
  if (String(meId) === String(otherId)) throw new AppError('Cannot chat with yourself', 422);
  const other = await db.User.findByPk(otherId, { attributes: USER_ATTRS });
  if (!other) throw new AppError('User not found', 404);

  const [userOneId, userTwoId] = orderedPair(meId, otherId);
  const [convo] = await db.Conversation.findOrCreate({ where: { userOneId, userTwoId } });
  return convo;
}

// Conversation the viewer participates in, or 404
export async function getMyConversation(id, meId) {
  const convo = await db.Conversation.findByPk(id);
  const mine =
    convo && [String(convo.userOneId), String(convo.userTwoId)].includes(String(meId));
  if (!mine) throw new AppError('Conversation not found', 404);
  return convo;
}

export function otherUserId(convo, meId) {
  return String(convo.userOneId) === String(meId)
    ? String(convo.userTwoId)
    : String(convo.userOneId);
}

export function serializeMessage(message) {
  return {
    id: String(message.id),
    conversationId: String(message.conversationId),
    senderId: String(message.senderId),
    content: message.content,
    readAt: message.readAt,
    createdAt: message.createdAt,
  };
}

// { id, user: <the other participant>, lastMessage, unreadCount }
export function serializeConversation(convo, meId, { otherUser, lastMessage, unreadCount = 0 }) {
  return {
    id: String(convo.id),
    user: otherUser ? publicUserLite(otherUser) : null,
    lastMessage: lastMessage ? serializeMessage(lastMessage) : null,
    unreadCount,
    lastMessageAt: convo.lastMessageAt,
  };
}

// Unread incoming messages per conversation: Map convoId -> count
export async function unreadCounts(meId, conversationIds) {
  if (!conversationIds.length) return new Map();
  const rows = await db.Message.findAll({
    attributes: ['conversationId', [db.sequelize.fn('COUNT', '*'), 'count']],
    where: {
      conversationId: { [Op.in]: conversationIds },
      senderId: { [Op.ne]: meId },
      readAt: null,
    },
    group: ['conversationId'],
    raw: true,
  });
  return new Map(rows.map((r) => [String(r.conversationId), Number(r.count)]));
}

// Fully serialized conversation (other user, last message, unread) for one convo
export async function conversationPayload(convo, meId) {
  const [otherUser, lastMessage, unread] = await Promise.all([
    db.User.findByPk(otherUserId(convo, meId), { attributes: USER_ATTRS }),
    convo.lastMessageId ? db.Message.findByPk(convo.lastMessageId) : null,
    unreadCounts(meId, [convo.id]),
  ]);
  return serializeConversation(convo, meId, {
    otherUser,
    lastMessage,
    unreadCount: unread.get(String(convo.id)) || 0,
  });
}
