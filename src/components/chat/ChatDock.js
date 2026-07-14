'use client';

import { useChat } from './ChatProvider';
import ChatWindow from './ChatWindow';

// Facebook-style dock: open chat windows pinned to the bottom-right
export default function ChatDock() {
  const chat = useChat();
  if (!chat?.me || chat.openChats.length === 0) return null;

  return (
    <div className="_cdock">
      {chat.openChats.map((c) => (
        <ChatWindow key={c.conversation.id} conversation={c.conversation} minimized={c.minimized} />
      ))}
    </div>
  );
}
