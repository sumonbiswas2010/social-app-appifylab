'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiCall } from '@/lib/apiCall';
import { timeAgoShort } from '@/lib/timeAgo';
import Navbar from '../Navbar';
import Avatar from '../Avatar';
import ChatProvider, { useChat } from './ChatProvider';
import MessengerThread from './MessengerThread';

// Full-page messenger (/messages): conversation list + open thread,
// built on the template's _chat_* classes.
export default function MessengerPage() {
  const [me, setMe] = useState(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    apiCall('/api/auth/me').then(setMe).catch(() => {});
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.theme = next ? 'dark' : 'light';
    } catch {}
  }

  return (
    <div className={`_layout _layout_main_wrapper _layout_chat${dark ? ' _dark_wrapper' : ''}`}>
      <div className="_layout_mode_swithing_btn">
        <button type="button" className="_layout_swithing_btn_link" onClick={toggleDark} aria-label="Toggle dark mode">
          <div className="_layout_swithing_btn">
            <div className="_layout_swithing_btn_round"></div>
          </div>
          <div className="_layout_change_btn_ic1">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="16" fill="none" viewBox="0 0 11 16">
              <path fill="#fff" d="M2.727 14.977l.04-.498-.04.498zm-1.72-.49l.489-.11-.489.11zM3.232 1.212L3.514.8l-.282.413zM9.792 8a6.5 6.5 0 00-6.5-6.5v-1a7.5 7.5 0 017.5 7.5h-1zm-6.5 6.5a6.5 6.5 0 006.5-6.5h1a7.5 7.5 0 01-7.5 7.5v-1zm-.525-.02c.173.013.348.02.525.02v1c-.204 0-.405-.008-.605-.024l.08-.997zm-.261-1.83A6.498 6.498 0 005.792 7h1a7.498 7.498 0 01-3.791 6.52l-.495-.87zM5.792 7a6.493 6.493 0 00-2.841-5.374L3.514.8A7.493 7.493 0 016.792 7h-1zm-3.105 8.476c-.528-.042-.985-.077-1.314-.155-.316-.075-.746-.242-.854-.726l.977-.217c-.028-.124-.145-.09.106-.03.237.056.6.086 1.165.131l-.08.997zm.314-1.956c-.622.354-1.045.596-1.31.792a.967.967 0 00-.204.185c-.01.013.027-.038.009-.12l-.977.218a.836.836 0 01.144-.666c.112-.162.27-.3.433-.42.324-.24.814-.519 1.41-.858L3 13.52zM3.292 1.5a.391.391 0 00.374-.285A.382.382 0 003.514.8l-.563.826A.618.618 0 012.702.95a.609.609 0 01.59-.45v1z" />
            </svg>
          </div>
          <div className="_layout_change_btn_ic2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4.389" stroke="#fff" transform="rotate(-90 12 12)" />
              <path stroke="#fff" strokeLinecap="round" d="M3.444 12H1M23 12h-2.444M5.95 5.95L4.222 4.22M19.778 19.779L18.05 18.05M12 3.444V1M12 23v-2.445M18.05 5.95l1.728-1.729M4.222 19.779L5.95 18.05" />
            </svg>
          </div>
        </button>
      </div>

      <ChatProvider me={me} autoOpen={false}>
        <div className="_main_layout">
          <Navbar me={me} />
          <MessengerBody me={me} />
        </div>
      </ChatProvider>
    </div>
  );
}

function MessengerBody({ me }) {
  const chat = useChat();
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    apiCall('/api/chat/users')
      .then((d) => setPeople(d.users))
      .catch(() => {});
  }, []);

  const convos = chat?.convos || [];
  const selected = convos.find((c) => c.id === selectedId) || null;

  // Default to the most recent conversation once the list loads
  useEffect(() => {
    if (!selectedId && convos.length > 0) setSelectedId(convos[0].id);
  }, [convos, selectedId]);

  const q = query.trim().toLowerCase();
  const shownConvos = convos.filter(
    (c) => !q || `${c.user?.firstName} ${c.user?.lastName}`.toLowerCase().includes(q)
  );
  // People you have no conversation with yet, for starting a new chat
  const knownUserIds = useMemo(() => new Set(convos.map((c) => String(c.user?.id))), [convos]);
  const newPeople = people.filter(
    (u) =>
      !knownUserIds.has(String(u.id)) &&
      (!q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q))
  );

  async function startChat(user) {
    if (starting) return;
    setStarting(true);
    try {
      const convo = await apiCall('/api/chat/conversations', { method: 'POST', body: { userId: user.id } });
      chat?.refreshConvos();
      setSelectedId(convo.id);
      setQuery('');
    } finally {
      setStarting(false);
    }
  }

  const online = chat?.online || new Set();

  return (
    <div className="container-fluid">
      <div className="_chat_wrapper">
        <div className="row" style={{ height: '100%', margin: 0 }}>
          {/* Left: conversations */}
          <div className="col-xl-3 col-lg-4 col-md-5 _chat_left" style={{ height: '100%' }}>
            <div className="_chat_left_content">
              <div className="_chat_left_top">
                <div className="_chat_top">
                  <h4 className="_title5">Chats</h4>
                </div>
                <form className="_chat_left_form _mar_t16 _mar_b16" onSubmit={(e) => e.preventDefault()}>
                  <svg className="_chat_left_form_svg" xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 17 17">
                    <circle cx="7" cy="7" r="6" stroke="#666"></circle>
                    <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3"></path>
                  </svg>
                  <input
                    className="_chat_left_form_input"
                    type="search"
                    placeholder="Search people"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </form>
              </div>
              <div className="_chat_left_bottom">
                {shownConvos.map((c) => {
                  const isOnline = c.user && online.has(String(c.user.id));
                  const active = c.id === selectedId;
                  return (
                    <div
                      key={c.id}
                      className={`_chat_box _mar_b16 _padd_t12 _padd_b12 _padd_l12 _padd_r12${active ? ' _chat_active_inner' : ''}`}
                      onClick={() => setSelectedId(c.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="_chat_left_inner_box_image">
                        <span className="_cdock_avatar">
                          <Avatar user={c.user} size="h-12 w-12" />
                          {isOnline && <span className="_cdock_online_dot" />}
                        </span>
                      </div>
                      <div className="_chat_left_inner_box_txt" style={{ minWidth: 0 }}>
                        <h4 className="_chat_left_inner_box_txt_title">
                          {c.user ? `${c.user.firstName} ${c.user.lastName}` : '...'}
                        </h4>
                        <p className="_chat_left_inner_box_txt_para">
                          {c.lastMessage
                            ? `${c.lastMessage.senderId === me?.id ? 'You: ' : ''}${c.lastMessage.content}`
                            : 'New conversation'}
                        </p>
                      </div>
                      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        <p className="_chat_left_inner_box_date_para">
                          {c.lastMessageAt ? timeAgoShort(c.lastMessageAt) : ''}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="_chat_left_inner_box_date_txt">{c.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {newPeople.length > 0 && (
                  <>
                    <div className="_chat_top _mar_b16">
                      <h4 className="_title5" style={{ fontSize: 15 }}>People</h4>
                    </div>
                    {newPeople.map((u) => (
                      <div
                        key={u.id}
                        className="_chat_box _mar_b16 _padd_t12 _padd_b12 _padd_l12 _padd_r12"
                        onClick={() => startChat(u)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="_chat_left_inner_box_image">
                          <span className="_cdock_avatar">
                            <Avatar user={u} size="h-12 w-12" />
                            {online.has(String(u.id)) && <span className="_cdock_online_dot" />}
                          </span>
                        </div>
                        <div className="_chat_left_inner_box_txt">
                          <h4 className="_chat_left_inner_box_txt_title">
                            {u.firstName} {u.lastName}
                          </h4>
                          <p className="_chat_left_inner_box_txt_para">
                            {online.has(String(u.id)) ? 'Active now' : 'Start a conversation'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {shownConvos.length === 0 && newPeople.length === 0 && (
                  <p className="_chat_left_inner_box_txt_para" style={{ padding: '12px 0' }}>
                    No people found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: open thread */}
          <div className="col-xl-9 col-lg-8 col-md-7" style={{ height: '100%', padding: 0 }}>
            {selected && me ? (
              <MessengerThread key={selected.id} conversation={selected} />
            ) : (
              <div className="_chat_right chat_inner_wrap" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <p className="_chat_left_inner_box_txt_para" style={{ width: 'auto' }}>
                  {convos.length === 0
                    ? 'No conversations yet — pick someone from the list to start chatting.'
                    : 'Select a conversation'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
