'use client';

import { useEffect, useState } from 'react';
import { apiCall } from '@/lib/apiCall';
import Avatar from './Avatar';
import { useChat } from './chat/ChatProvider';

export default function RightSidebar() {
  const chat = useChat();
  const [users, setUsers] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiCall('/api/chat/users')
      .then((d) => setUsers(d.users))
      .catch(() => setUsers([]));
  }, []);

  const online = chat?.online || new Set();
  const shown = (users || []).filter((u) =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  // Online people first, like Facebook's contacts rail
  const sorted = [...shown].sort(
    (a, b) => Number(online.has(String(b.id))) - Number(online.has(String(a.id)))
  );

  return (
    <div className="_layout_right_sidebar_wrap">
      <div className="_layout_right_sidebar_inner">
        <div className="_feed_right_inner_area_card _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <div className="_feed_top_fixed">
            <div className="_feed_right_inner_area_card_content _mar_b24">
              <h4 className="_feed_right_inner_area_card_content_title _title5">Your Friends</h4>
              <span className="_feed_right_inner_area_card_content_txt">
                <a className="_feed_right_inner_area_card_content_txt_link" href="/messages">See All</a>
              </span>
            </div>
            <form className="_feed_right_inner_area_card_form" onSubmit={(e) => e.preventDefault()}>
              <svg className="_feed_right_inner_area_card_form_svg" xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 17 17">
                <circle cx="7" cy="7" r="6" stroke="#666"></circle>
                <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3"></path>
              </svg>
              <input
                className="form-control me-2 _feed_right_inner_area_card_form_inpt"
                type="search"
                placeholder="Search friends"
                aria-label="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          </div>
          <div className="_feed_bottom_fixed">
            {!users && <p style={{ padding: '12px 0', color: '#888', fontSize: 14 }}>Loading...</p>}
            {users && sorted.length === 0 && (
              <p style={{ padding: '12px 0', color: '#888', fontSize: 14 }}>No people found</p>
            )}
            {sorted.map((u) => {
              const isOnline = online.has(String(u.id));
              return (
                <div
                  className={`_feed_right_inner_area_card_ppl${isOnline ? '' : ' _feed_right_inner_area_card_ppl_inactive'}`}
                  key={u.id}
                  onClick={() => chat?.openChatWith(u)}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="_feed_right_inner_area_card_ppl_box">
                    <div className="_feed_right_inner_area_card_ppl_image">
                      <Avatar user={u} size="h-10 w-10" />
                    </div>
                    <div className="_feed_right_inner_area_card_ppl_txt">
                      <h4 className="_feed_right_inner_area_card_ppl_title">
                        {u.firstName} {u.lastName}
                      </h4>
                      <p className="_feed_right_inner_area_card_ppl_para">
                        {isOnline ? 'Active now' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="_feed_right_inner_area_card_ppl_side">
                    {isOnline ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 14 14">
                        <rect width="12" height="12" x="1" y="1" fill="#0ACF83" stroke="#fff" strokeWidth="2" rx="6" />
                      </svg>
                    ) : (
                      <span></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
