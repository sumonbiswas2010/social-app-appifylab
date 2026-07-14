'use client';

import { useEffect, useRef, useState } from 'react';
import Avatar from '../Avatar';
import { useChat } from './ChatProvider';
import useThread from './useThread';

// One docked popup window (Facebook-style)
export default function ChatWindow({ conversation, minimized }) {
  const { me, online, closeChat, toggleMinimize, convos } = useChat();
  const { messages, hasMore, loadingOlder, loadOlder, send, typing, emitTyping, markRead } =
    useThread(conversation, { active: !minimized });

  const [draft, setDraft] = useState('');
  const bodyRef = useRef(null);
  const typingRef = useRef({ timer: null, on: false });
  const other = conversation.user;
  const isOnline = other && online.has(String(other.id));
  const unread = convos.find((c) => c.id === conversation.id)?.unreadCount || 0;

  // Pin to the bottom on new messages / open
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, minimized, typing]);

  // Re-opening a minimized window means the user saw the messages
  useEffect(() => {
    if (!minimized && unread > 0) markRead();
  }, [minimized]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopTypingSignal() {
    clearTimeout(typingRef.current.timer);
    if (typingRef.current.on) {
      typingRef.current.on = false;
      emitTyping(false);
    }
  }

  function handleInput(value) {
    setDraft(value);
    if (!typingRef.current.on) {
      typingRef.current.on = true;
      emitTyping(true);
    }
    clearTimeout(typingRef.current.timer);
    typingRef.current.timer = setTimeout(stopTypingSignal, 1500);
  }

  async function submit(e) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    stopTypingSignal();
    try {
      await send(content);
    } catch {
      setDraft(content); // let the user retry
    }
  }

  const lastMineIdx = messages
    ? messages.reduce((acc, m, i) => (String(m.senderId) === String(me.id) ? i : acc), -1)
    : -1;

  return (
    <div className={`_cdock_window${minimized ? ' _cdock_window_min' : ''}`}>
      <div
        className="_cdock_head"
        onClick={() => toggleMinimize(conversation.id)}
        role="button"
        tabIndex={0}
      >
        <div className="_cdock_head_user">
          <span className="_cdock_avatar">
            <Avatar user={other} size="h-8 w-8" textSize="text-xs" />
            {isOnline && <span className="_cdock_online_dot" />}
          </span>
          <span className="_cdock_head_txt">
            <span className="_cdock_head_name">
              {other ? `${other.firstName} ${other.lastName}` : '...'}
            </span>
            <span className="_cdock_head_status">{isOnline ? 'Active now' : 'Offline'}</span>
          </span>
        </div>
        {minimized && unread > 0 && <span className="_cdock_badge">{unread}</span>}
        <div className="_cdock_head_actions">
          <button
            type="button"
            className="_cdock_head_btn"
            aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize(conversation.id);
            }}
          >
            &#8211;
          </button>
          <button
            type="button"
            className="_cdock_head_btn"
            aria-label="Close chat"
            onClick={(e) => {
              e.stopPropagation();
              closeChat(conversation.id);
            }}
          >
            &times;
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="_cdock_body" ref={bodyRef}>
            {hasMore && (
              <button type="button" className="_cdock_older" onClick={loadOlder} disabled={loadingOlder}>
                {loadingOlder ? 'Loading...' : 'Load older messages'}
              </button>
            )}
            {!messages && <p className="_cdock_hint">Loading...</p>}
            {messages?.length === 0 && (
              <p className="_cdock_hint">Say hi to {other?.firstName} 👋</p>
            )}
            {messages?.map((m, i) => {
              const mine = String(m.senderId) === String(me.id);
              return (
                <div key={m.id} className={`_cdock_row${mine ? ' _cdock_row_mine flex flex-col gap-1' : ''}`}>
                  {!mine && <Avatar user={other} size="h-6 w-6" textSize="text-[10px]" />}
                  <div
                    className={`_cdock_bubble${mine ? ' _cdock_bubble_mine' : ''}`}
                    title={new Date(m.createdAt).toLocaleString()}
                  >
                    {m.content}
                  </div>
                  {mine && i === lastMineIdx && m.readAt && (
                    <span className="_cdock_seen">Seen</span>
                  )}
                </div>
              );
            })}
            {typing && (
              <div className="_cdock_row">
                <Avatar user={other} size="h-6 w-6" textSize="text-[10px]" />
                <div className="_cdock_bubble _cdock_typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>
          <form className="_cdock_foot" onSubmit={submit}>
            <input
              className="_cdock_input"
              type="text"
              placeholder="Aa"
              value={draft}
              maxLength={2000}
              onChange={(e) => handleInput(e.target.value)}
            />
            <button type="submit" className="_cdock_send" aria-label="Send" disabled={!draft.trim()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
}
