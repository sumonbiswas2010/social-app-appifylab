'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiCall } from '@/lib/apiCall';
import { useChat } from './ChatProvider';

// Everything one conversation thread needs: message history + pagination,
// live socket updates (new message / read receipt / typing), sending, and
// read-marking. Shared by the popup windows and the full /messages page.
// `active` = the thread is visible to the user, so incoming messages are
// marked read immediately.
export default function useThread(conversation, { active = true } = {}) {
  const { me, userChannel, clearUnread } = useChat();
  const convoId = conversation.id;
  const otherId = conversation.user?.id;

  const [messages, setMessages] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  const markRead = useCallback(() => {
    apiCall(`/api/chat/conversations/${convoId}/read`, { method: 'POST' })
      .then(() => clearUnread(convoId))
      .catch(() => {});
  }, [convoId, clearUnread]);
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;

  // Initial history
  useEffect(() => {
    let alive = true;
    apiCall(`/api/chat/conversations/${convoId}/messages`)
      .then((d) => {
        if (!alive) return;
        setMessages(d.messages);
        setCursor(d.nextCursor);
      })
      .catch(() => alive && setMessages([]));
    if (activeRef.current) markReadRef.current();
    return () => {
      alive = false;
    };
  }, [convoId]);

  // Live updates for this conversation only
  useEffect(() => {
    if (!userChannel) return;

    const isMine = (id) => String(id) === String(me.id);

    const onMessage = ({ message }) => {
      if (String(message.conversationId) !== String(convoId)) return;
      setMessages((cur) =>
        cur && !cur.some((m) => m.id === message.id) ? [...cur, message] : cur
      );
      if (!isMine(message.senderId)) {
        setTyping(false);
        if (activeRef.current && document.visibilityState === 'visible') markReadRef.current();
      }
    };

    const onRead = ({ conversationId, readerId, readAt }) => {
      if (String(conversationId) !== String(convoId) || isMine(readerId)) return;
      setMessages((cur) =>
        cur ? cur.map((m) => (isMine(m.senderId) && !m.readAt ? { ...m, readAt } : m)) : cur
      );
    };

    const onTyping = (data) => {
      if (String(data.conversationId) !== String(convoId) || isMine(data.fromUserId)) return;
      clearTimeout(typingTimer.current);
      setTyping(!!data.typing);
      if (data.typing) typingTimer.current = setTimeout(() => setTyping(false), 3000);
    };

    userChannel.bind('chat:message', onMessage);
    userChannel.bind('chat:read', onRead);
    userChannel.bind('chat:typing', onTyping);
    return () => {
      userChannel.unbind('chat:message', onMessage);
      userChannel.unbind('chat:read', onRead);
      userChannel.unbind('chat:typing', onTyping);
      clearTimeout(typingTimer.current);
    };
  }, [userChannel, convoId, me.id]);

  const send = useCallback(
    async (content) => {
      // Show the message instantly, then reconcile with the saved row. The
      // Pusher echo dedupes against the temp id / real id below.
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimistic = {
        id: tempId,
        conversationId: String(convoId),
        senderId: String(me.id),
        content,
        readAt: null,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      setMessages((cur) => (cur ? [...cur, optimistic] : [optimistic]));
      try {
        const msg = await apiCall(`/api/chat/conversations/${convoId}/messages`, {
          method: 'POST',
          body: { content },
        });
        setMessages((cur) => {
          if (!cur) return cur;
          const withoutTemp = cur.filter((m) => m.id !== tempId);
          // the Pusher echo may already have added the real message
          return withoutTemp.some((m) => m.id === msg.id) ? withoutTemp : [...withoutTemp, msg];
        });
        return msg;
      } catch (err) {
        setMessages((cur) => (cur ? cur.filter((m) => m.id !== tempId) : cur));
        throw err;
      }
    },
    [convoId, me.id]
  );

  const loadOlder = useCallback(async () => {
    if (!cursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const d = await apiCall(`/api/chat/conversations/${convoId}/messages?cursor=${cursor}`);
      setMessages((cur) => [...d.messages, ...(cur || [])]);
      setCursor(d.nextCursor);
    } finally {
      setLoadingOlder(false);
    }
  }, [convoId, cursor, loadingOlder]);

  // Typing is relayed through the server (throttled to start/stop, so the
  // extra request is cheap) rather than a peer-to-peer socket message.
  const emitTyping = useCallback(
    (isTyping) => {
      apiCall(`/api/chat/conversations/${convoId}/typing`, {
        method: 'POST',
        body: { typing: isTyping },
      }).catch(() => {});
    },
    [convoId]
  );

  return { messages, hasMore: !!cursor, loadingOlder, loadOlder, send, typing, emitTyping, markRead };
}
