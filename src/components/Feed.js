'use client';

import { useEffect, useState } from 'react';
import { apiCall } from '@/lib/apiCall';
import { getSocket } from '@/lib/socketClient';
import ChatProvider from './chat/ChatProvider';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Stories from './Stories';
import Composer from './Composer';
import PostCard from './PostCard';
import { FeedSkeleton } from './Shimmer';

export default function Feed() {
  const [me, setMe] = useState(null);
  const [posts, setPosts] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    apiCall('/api/auth/me').then(setMe).catch(() => {});
    apiCall('/api/posts').then((data) => {
      setPosts(data.posts);
      setCursor(data.nextCursor);
    });
  }, []);

  // Live feed: new public posts from other users appear instantly
  useEffect(() => {
    if (!me) return;
    const s = getSocket();
    const onPost = (post) => {
      setPosts((cur) => {
        if (!cur || cur.some((p) => p.id === post.id)) return cur;
        return [post, ...cur];
      });
    };
    s.on('post:new', onPost);
    return () => s.off('post:new', onPost);
  }, [me]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.theme = next ? 'dark' : 'light';
    } catch {}
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await apiCall(`/api/posts?cursor=${cursor}`);
      setPosts((cur) => [...cur, ...data.posts]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className={`_layout _layout_main_wrapper${dark ? ' _dark_wrapper' : ''}`}>
      {/* Dark / light switching button */}
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

      <ChatProvider me={me}>
      <div className="_main_layout">
        <Navbar me={me} />
        <MobileNav />

        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              {/* Left Sidebar */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <LeftSidebar />
              </div>

              {/* Layout Middle */}
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">
                    <Stories me={me} />
                    <Composer me={me} onCreated={(post) => setPosts((cur) => [post, ...(cur || [])])} />

                    {!posts && <FeedSkeleton />}
                    {posts?.length === 0 && (
                      <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
                        <p className="text-center" style={{ margin: 0, color: '#666' }}>
                          No posts yet. Be the first to share something!
                        </p>
                      </div>
                    )}
                    {posts?.map((p) => (
                      <PostCard
                        key={p.id}
                        me={me}
                        post={p}
                        onDeleted={(id) => setPosts((cur) => cur.filter((x) => x.id !== id))}
                      />
                    ))}
                    {loadingMore && <FeedSkeleton count={1} />}
                    {cursor && !loadingMore && (
                      <div className="_previous_comment" style={{ textAlign: 'center', paddingBottom: 24 }}>
                        <button type="button" className="_previous_comment_txt" onClick={loadMore}>
                          Load more posts
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <RightSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
      </ChatProvider>
    </div>
  );
}
