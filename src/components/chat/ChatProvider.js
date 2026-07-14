'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiCall } from '@/lib/apiCall';
import { getPusher } from '@/lib/pusherClient';
import ChatDock from './ChatDock';
import Toasts from './Toasts';

const MAX_WINDOWS = 3;
const ChatContext = createContext(null);

export function useChat() {
  return useContext(ChatContext);
}

let toastSeq = 0;

// Owns the socket connection and everything realtime the UI shares:
// presence, the conversation list (for badges/dropdowns), the Facebook-style
// dock of open chat windows, and lightweight toasts.
// autoOpen: pop a dock window when a message arrives (disabled on the full
// /messages page, where the thread is already on screen)
export default function ChatProvider({ me, children, autoOpen = true }) {
  const [userChannel, setUserChannel] = useState(null);
  const [online, setOnline] = useState(() => new Set());
  const [convos, setConvos] = useState([]);
  const [openChats, setOpenChats] = useState([]); // [{ conversation, minimized }]
  const [toasts, setToasts] = useState([]);
  const meId = me?.id;

  const pushToast = useCallback((toast) => {
    const id = ++toastSeq;
    setToasts((cur) => [...cur.slice(-3), { id, ...toast }]);
    setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const refreshConvos = useCallback(() => {
    apiCall('/api/chat/conversations')
      .then((d) => setConvos(d.conversations))
      .catch(() => {});
  }, []);

  // Add a window for a conversation (or surface the existing one)
  const openConversation = useCallback((conversation) => {
    setOpenChats((cur) => {
      const existing = cur.find((c) => c.conversation.id === conversation.id);
      if (existing) {
        return cur.map((c) =>
          c.conversation.id === conversation.id ? { ...c, conversation, minimized: false } : c
        );
      }
      return [...cur.slice(-(MAX_WINDOWS - 1)), { conversation, minimized: false }];
    });
  }, []);

  // Start (or resume) a chat with a user — from the sidebar, dropdown, etc.
  const openChatWith = useCallback(
    async (user) => {
      const existing = convos.find((c) => c.user?.id === user.id);
      if (existing) return openConversation(existing);
      try {
        const convo = await apiCall('/api/chat/conversations', { method: 'POST', body: { userId: user.id } });
        setConvos((cur) => (cur.some((c) => c.id === convo.id) ? cur : [convo, ...cur]));
        openConversation(convo);
      } catch {
        pushToast({ text: 'Could not open chat' });
      }
    },
    [convos, openConversation, pushToast]
  );

  const closeChat = useCallback((conversationId) => {
    setOpenChats((cur) => cur.filter((c) => c.conversation.id !== conversationId));
  }, []);

  const toggleMinimize = useCallback((conversationId) => {
    setOpenChats((cur) =>
      cur.map((c) => (c.conversation.id === conversationId ? { ...c, minimized: !c.minimized } : c))
    );
  }, []);

  // Called by windows after POST .../read succeeds
  const clearUnread = useCallback((conversationId) => {
    setConvos((cur) => cur.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
  }, []);

  // Keep refs so socket handlers registered once always see fresh state
  const openConversationRef = useRef(openConversation);
  openConversationRef.current = openConversation;
  const refreshConvosRef = useRef(refreshConvos);
  refreshConvosRef.current = refreshConvos;
  const pushToastRef = useRef(pushToast);
  pushToastRef.current = pushToast;

  useEffect(() => {
    if (!meId) return;
    const pusher = getPusher();
    // Targeted events for me: chat, read receipts, notifications, typing.
    const channel = pusher.subscribe(`private-user-${meId}`);
    setUserChannel(channel);
    refreshConvosRef.current();

    // Presence channel membership is the online-user set (replaces the
    // server-side presence map the old socket server kept).
    const presence = pusher.subscribe('presence-online');
    const syncOnline = () =>
      setOnline(new Set(Object.keys(presence.members?.members || {})));
    presence.bind('pusher:subscription_succeeded', syncOnline);
    presence.bind('pusher:member_added', syncOnline);
    presence.bind('pusher:member_removed', syncOnline);

    const onMessage = ({ message, conversation }) => {
      if (conversation) {
        // Incoming message: server sent the fresh conversation snapshot
        // (including unread count), so upsert it to the top of the list
        setConvos((cur) => [conversation, ...cur.filter((c) => c.id !== conversation.id)]);
        // Facebook behavior: pop the chat window open if it isn't already
        if (autoOpen) openConversationRef.current(conversation);
      } else {
        // Echo of my own message (another tab/device): just refresh the row
        setConvos((cur) => {
          const found = cur.find((c) => c.id === message.conversationId);
          if (!found) {
            refreshConvosRef.current();
            return cur;
          }
          const updated = { ...found, lastMessage: message, lastMessageAt: message.createdAt };
          return [updated, ...cur.filter((c) => c.id !== message.conversationId)];
        });
      }
    };

    const onNotification = (n) => {
      if (n?.type === 'post' && n.actor) {
        pushToastRef.current({ text: `${n.actor.firstName} ${n.actor.lastName} shared a new post` });
      }
    };

    channel.bind('chat:message', onMessage);
    channel.bind('notification:new', onNotification);
    return () => {
      channel.unbind('chat:message', onMessage);
      channel.unbind('notification:new', onNotification);
      presence.unbind('pusher:subscription_succeeded', syncOnline);
      presence.unbind('pusher:member_added', syncOnline);
      presence.unbind('pusher:member_removed', syncOnline);
      pusher.unsubscribe(`private-user-${meId}`);
      pusher.unsubscribe('presence-online');
      setUserChannel(null);
    };
  }, [meId]);

  const totalUnread = useMemo(
    () => convos.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [convos]
  );

  const value = useMemo(
    () => ({
      me,
      userChannel,
      online,
      convos,
      totalUnread,
      openChats,
      openChatWith,
      openConversation,
      closeChat,
      toggleMinimize,
      clearUnread,
      refreshConvos,
      pushToast,
    }),
    [me, userChannel, online, convos, totalUnread, openChats, openChatWith, openConversation, closeChat, toggleMinimize, clearUnread, refreshConvos, pushToast]
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
      <ChatDock />
      <Toasts toasts={toasts} dismiss={dismissToast} />
    </ChatContext.Provider>
  );
}
