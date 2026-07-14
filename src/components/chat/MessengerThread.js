'use client';

import { useEffect, useRef, useState } from 'react';
import Avatar from '../Avatar';
import { useChat } from './ChatProvider';
import useThread from './useThread';

function bubbleTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function dayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

// The open thread on the /messages page, using the template's chat markup
export default function MessengerThread({ conversation }) {
  const { me, online } = useChat();
  const { messages, hasMore, loadingOlder, loadOlder, send, typing, emitTyping } =
    useThread(conversation, { active: true });

  const [draft, setDraft] = useState('');
  const bodyRef = useRef(null);
  const typingRef = useRef({ timer: null, on: false });
  const other = conversation.user;
  const isOnline = other && online.has(String(other.id));

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

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
    } catch (err) {
      setDraft(content);
      window.alert(err?.message || 'Message failed to send');
    }
  }

  const lastMineIdx = messages
    ? messages.reduce((acc, m, i) => (String(m.senderId) === String(me.id) ? i : acc), -1)
    : -1;

  return (
    <div className="_chat_right chat_inner_wrap">
      {/* header */}
      <div className="_chat_right_top_inner _padd_t16 _padd_b16 _padd_l24 _padd_r24">
        <div className="_chat_right_top_inner_box">
          <div className="_chat_right_top_inner_box_image">
            <span className="_cdock_avatar">
              <Avatar user={other} size="h-12 w-12" />
              {isOnline && <span className="_cdock_online_dot" />}
            </span>
          </div>
          <div className="_chat_right_top_inner_box_txt">
            <h4 className="_chat_right_top_inner_box_txt_title">
              {other ? `${other.firstName} ${other.lastName}` : '...'}
            </h4>
            <p className="_chat_right_top_inner_box_txt_para">
              {typing ? 'Typing...' : isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
      </div>
      <hr className="_underline" style={{ margin: 0 }} />

      {/* messages */}
      <div className="_chat_middle_box _padd_l24 _padd_r24 _padd_b24" ref={bodyRef}>
        {hasMore && (
          <div style={{ textAlign: 'center', paddingTop: 12 }}>
            <button type="button" className="_previous_comment_txt _cdock_older" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}
        {!messages && (
          <p className="_chat_left_inner_box_txt_para" style={{ padding: '24px 0', width: 'auto' }}>
            Loading messages...
          </p>
        )}
        {messages?.length === 0 && (
          <p className="_chat_left_inner_box_txt_para" style={{ padding: '24px 0', width: 'auto' }}>
            No messages yet. Say hi to {other?.firstName} 👋
          </p>
        )}
        {messages?.map((m, i) => {
          const mine = String(m.senderId) === String(me.id);
          const prev = messages[i - 1];
          const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
          return (
            <div key={m.id}>
              {newDay && (
                <div className="_chat_middle_day" style={{ top: 0, margin: '24px auto 0' }}>
                  <span className="_chat_middle_day_txt">{dayLabel(m.createdAt)}</span>
                </div>
              )}
              {mine ? (
                <div className="_chat_middle_box_reciver" style={m.pending ? { opacity: 0.6 } : undefined}>
                  <div className="_chat_middle_box_reciver_area">
                    <div className="_chat_middle_message">
                      <div className="_chat_middle_box_sender_txt">
                        <p className="_chat_middle_box_sender_txt_para" style={{ whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </p>
                      </div>
                    </div>
                    <div className="chat_middle_box_image">
                      <Avatar user={me} size="h-11 w-11" />
                    </div>
                  </div>
                  <div className="_chat_middle_box_time">
                    <span className="_chat_middle_box_time_txt">
                      {bubbleTime(m.createdAt)}
                      {i === lastMineIdx && m.readAt ? ' · Seen' : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ margin: '30px 0 0' }}>
                  <div className="_chat_middle_box_sender">
                    <div className="chat_middle_box_image">
                      <Avatar user={other} size="h-11 w-11" />
                    </div>
                    <div className="_chat_middle_message">
                      <div className="_chat_middle_box_sender_txt">
                        <p className="_chat_middle_box_sender_txt_para" style={{ whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="_chat_middle_box_time">
                    <span className="_chat_middle_box_time_txt">{bubbleTime(m.createdAt)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {typing && (
          <div className="_chat_middle_box_sender" style={{ margin: '30px 0 0' }}>
            <div className="chat_middle_box_image">
              <Avatar user={other} size="h-11 w-11" />
            </div>
            <div className="_chat_middle_message">
              <div className="_chat_middle_box_sender_txt">
                <div className="_cdock_typing" style={{ padding: '4px 0' }}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* composer */}
      <div className="_chat_right_bottom_inner _padd_t16 _padd_b16 _padd_l24 _padd_r24">
        <form className="_chat_right_bottom_inner_box" onSubmit={submit} style={{ gap: 12, alignItems: 'center' }}>
          <input
            className="_chat_textarea"
            style={{ width: '100%', flex: '1 1 auto' }}
            type="text"
            placeholder="Type a message..."
            value={draft}
            maxLength={2000}
            onChange={(e) => handleInput(e.target.value)}
          />
          <div className="_chat_bottom_icon">
            <button type="submit" className="_chat_bottom_icon_link1" disabled={!draft.trim()}>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
