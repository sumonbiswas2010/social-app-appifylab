'use client';

import { useRef, useState } from 'react';
import { apiCall } from '@/lib/apiCall';
import { timeAgo } from '@/lib/timeAgo';
import { REACTIONS } from '@/lib/reactions';
import Avatar from './Avatar';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import LikesModal from './LikesModal';
import { CommentSkeleton } from './Shimmer';

function LikeThumb({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill={active ? '#377DFF' : 'none'} stroke={active ? '#377DFF' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
    </svg>
  );
}

// Stacked reaction icons for the counts row (present types, biggest first)
function ReactionStack({ reactions }) {
  const types = Object.keys(reactions)
    .filter((t) => reactions[t] > 0 && REACTIONS[t])
    .sort((a, b) => reactions[b] - reactions[a]);
  if (!types.length) return null;
  return (
    <span style={{ display: 'inline-flex', marginRight: 6 }}>
      {types.map((t, i) => (
        <span
          key={t}
          title={`${REACTIONS[t].label} ${reactions[t]}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#fff',
            border: '2px solid #fff',
            boxShadow: '0 1px 3px rgba(0,0,0,.15)',
            fontSize: 13,
            lineHeight: 1,
            marginLeft: i ? -6 : 0,
            zIndex: types.length - i,
            position: 'relative',
          }}
        >
          {REACTIONS[t].emoji}
        </span>
      ))}
    </span>
  );
}

export default function PostCard({ me, post, onDeleted }) {
  const [item, setItem] = useState(post);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [comments, setComments] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const hideTimer = useRef(null);

  function openPicker() {
    clearTimeout(hideTimer.current);
    setPickerOpen(true);
  }

  function closePickerSoon() {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setPickerOpen(false), 350);
  }

  // React with `type`; same type again removes it, different type switches
  async function react(type) {
    clearTimeout(hideTimer.current);
    setPickerOpen(false);
    const prev = item;

    // optimistic update
    const reactions = { ...(item.reactions || {}) };
    const current = item.myReaction;
    let likesCount = item.likesCount;
    let myReaction;
    if (current === type) {
      myReaction = null;
      likesCount -= 1;
      reactions[type] = (reactions[type] || 1) - 1;
      if (reactions[type] <= 0) delete reactions[type];
    } else {
      myReaction = type;
      if (current) {
        reactions[current] = (reactions[current] || 1) - 1;
        if (reactions[current] <= 0) delete reactions[current];
      } else {
        likesCount += 1;
      }
      reactions[type] = (reactions[type] || 0) + 1;
    }
    setItem({ ...item, myReaction, likedByMe: !!myReaction, likesCount, reactions });

    try {
      const data = await apiCall(`/api/posts/${item.id}/like`, { method: 'POST', body: { type } });
      setItem((cur) => ({
        ...cur,
        myReaction: data.myReaction,
        likedByMe: data.liked,
        likesCount: data.likesCount,
        reactions: data.reactions || {},
      }));
    } catch {
      setItem(prev);
    }
  }

  async function loadComments(more = false) {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const qs = more && cursor ? `?cursor=${cursor}` : '';
      const data = await apiCall(`/api/posts/${item.id}/comments${qs}`);
      // API returns newest-first; keep that order (latest on top), older pages append below.
      setComments((cur) => (more ? [...(cur || []), ...data.comments] : data.comments));
      setCursor(data.nextCursor);
    } finally {
      setLoadingComments(false);
    }
  }

  function openComments() {
    if (!comments) loadComments();
  }

  // Optimistic: show the comment immediately, reconcile with the server row,
  // and roll it back with a message if the request fails.
  async function addComment(content) {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimistic = {
      id: tempId,
      postId: String(item.id),
      parentId: null,
      content,
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      user: me,
      isMine: true,
      likedByMe: false,
      pending: true,
    };
    setComments((cur) => [optimistic, ...(cur || [])]);
    setItem((cur) => ({ ...cur, commentsCount: cur.commentsCount + 1 }));
    try {
      const saved = await apiCall(`/api/posts/${item.id}/comments`, {
        method: 'POST',
        body: { content },
      });
      setComments((cur) => (cur || []).map((c) => (c.id === tempId ? saved : c)));
    } catch (err) {
      setComments((cur) => (cur || []).filter((c) => c.id !== tempId));
      setItem((cur) => ({ ...cur, commentsCount: Math.max(0, cur.commentsCount - 1) }));
      window.alert(err?.message || 'Failed to add comment');
    }
  }

  async function deletePost() {
    setMenuOpen(false);
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await apiCall(`/api/posts/${item.id}`, { method: 'DELETE' });
      onDeleted(item.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16" style={deleting ? { opacity: 0.5 } : undefined}>
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <Avatar user={item.user} size="h-11 w-11" />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">
                {item.user.firstName} {item.user.lastName}
              </h4>
              <p className="_feed_inner_timeline_post_box_para">
                {timeAgo(item.createdAt)} . <a href="#0">{item.privacy === 'private' ? 'Private' : 'Public'}</a>
              </p>
            </div>
          </div>
          {item.isMine && (
            <div className="_feed_inner_timeline_post_box_dropdown">
              <div className="_feed_timeline_post_dropdown">
                <button type="button" className="_feed_timeline_post_dropdown_link" onClick={() => setMenuOpen((v) => !v)} aria-label="Post options">
                  <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                    <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                    <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                    <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                  </svg>
                </button>
              </div>
              {/* Dropdown */}
              <div className={`_feed_timeline_dropdown _timeline_dropdown${menuOpen ? ' show' : ''}`}>
                <ul className="_feed_timeline_dropdown_list">
                  <li className="_feed_timeline_dropdown_item">
                    <a
                      href="#0"
                      className="_feed_timeline_dropdown_link"
                      onClick={(e) => {
                        e.preventDefault();
                        deletePost();
                      }}
                    >
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                          <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5zM7.5 8.25v4.5M10.5 8.25v4.5" />
                        </svg>
                      </span>
                      Delete Post
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
        {item.content && (
          <h4 className="_feed_inner_timeline_post_title" style={{ whiteSpace: 'pre-wrap' }}>
            {item.content}
          </h4>
        )}
        {item.imageUrl && (
          <div className="_feed_inner_timeline_image">
            <img src={item.imageUrl} alt="" className="_time_img" />
          </div>
        )}
      </div>

      {/* counts */}
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div
          className="_feed_inner_timeline_total_reacts_image"
          onClick={() => item.likesCount > 0 && setShowLikes(true)}
          style={{ cursor: item.likesCount > 0 ? 'pointer' : 'default' }}
          role="button"
          tabIndex={0}
          title="See who liked this post"
        >
          <ReactionStack reactions={item.reactions || {}} />
          <span style={{ fontSize: 14, color: '#666', lineHeight: '22px' }}>
            {item.likesCount > 0 ? item.likesCount : '0 Reactions'}
          </span>
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <a
              href="#0"
              onClick={(e) => {
                e.preventDefault();
                openComments();
              }}
            >
              <span>{item.commentsCount}</span> Comment{item.commentsCount !== 1 ? 's' : ''}
            </a>
          </p>
        </div>
      </div>

      {/* reactions */}
      <div className="_feed_inner_timeline_reaction" style={{ position: 'relative' }}>
        {/* fb-style reaction picker */}
        {pickerOpen && (
          <div
            onMouseEnter={openPicker}
            onMouseLeave={closePickerSoon}
            style={{
              position: 'absolute',
              top: -52,
              left: 8,
              display: 'flex',
              gap: 4,
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 4px 16px rgba(0,0,0,.18)',
              padding: '6px 10px',
              zIndex: 20,
            }}
          >
            {Object.entries(REACTIONS).map(([type, r]) => (
              <button
                key={type}
                type="button"
                onClick={() => react(type)}
                title={r.label}
                aria-label={r.label}
                style={{
                  border: 'none',
                  background: item.myReaction === type ? '#E7F0FF' : 'transparent',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  fontSize: 24,
                  lineHeight: 1,
                  cursor: 'pointer',
                  transition: 'transform .12s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className={`_feed_inner_timeline_reaction_emoji _feed_reaction${item.myReaction ? ' _feed_reaction_active' : ''}`}
          onClick={() => react(item.myReaction || 'like')}
          onMouseEnter={openPicker}
          onMouseLeave={closePickerSoon}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span className='flex gap-2' style={item.myReaction ? { color: REACTIONS[item.myReaction].color, fontWeight: 600 } : undefined}>
              {item.myReaction ? (
                <>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{REACTIONS[item.myReaction].emoji}</span>{' '}
                  {REACTIONS[item.myReaction].label}
                </>
              ) : (
                <>
                  <LikeThumb /> Like
                </>
              )}
            </span>
          </span>
        </button>
        <button type="button" className="_feed_inner_timeline_reaction_comment _feed_reaction" onClick={openComments}>
          <span className="_feed_inner_timeline_reaction_link">
            <span className='flex gap-2'>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21">
                <path stroke="#000" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z" />
                <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563" />
              </svg>{' '}
              Comment
            </span>
          </span>
        </button>
        <button type="button" className="_feed_inner_timeline_reaction_share _feed_reaction">
          <span className="_feed_inner_timeline_reaction_link">
            <span className='flex gap-2'>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21">
                <path stroke="#000" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z" />
              </svg>{' '}
              Share
            </span>
          </span>
        </button>
      </div>

      {/* comment box — always visible, like the template */}
      <div className="_feed_inner_timeline_cooment_area">
        <CommentForm me={me} onSubmit={addComment} />
      </div>
      {(item.commentsCount > 0 || comments?.length > 0) && (
        <div className="_timline_comment_main">
          {loadingComments && !comments && (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          )}
          {!comments && !loadingComments && item.commentsCount > 0 && (
            <div className="_previous_comment">
              <button type="button" className="_previous_comment_txt" onClick={() => loadComments()}>
                View {item.commentsCount} previous comment{item.commentsCount > 1 ? 's' : ''}
              </button>
            </div>
          )}
          {comments && cursor && (
            <div className="_previous_comment">
              <button type="button" className="_previous_comment_txt" onClick={() => loadComments(true)} disabled={loadingComments}>
                View previous comments
              </button>
            </div>
          )}
          {comments?.map((c) => (
            <CommentItem key={c.id} me={me} comment={c} />
          ))}
        </div>
      )}

      {showLikes && <LikesModal targetType="post" targetId={item.id} onClose={() => setShowLikes(false)} />}
    </div>
  );
}
