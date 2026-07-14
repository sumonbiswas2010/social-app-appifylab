'use client';

import { useState } from 'react';
import { apiCall } from '@/lib/apiCall';
import { timeAgoShort } from '@/lib/timeAgo';
import Avatar from './Avatar';
import CommentForm from './CommentForm';
import LikesModal from './LikesModal';
import { CommentSkeleton } from './Shimmer';

export default function CommentItem({ me, comment, isReply = false }) {
  const [item, setItem] = useState(comment);
  const [replies, setReplies] = useState(null);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showLikes, setShowLikes] = useState(false);

  async function toggleLike() {
    const prev = item;
    setItem({
      ...item,
      likedByMe: !item.likedByMe,
      likesCount: item.likesCount + (item.likedByMe ? -1 : 1),
    });
    try {
      const data = await apiCall(`/api/comments/${item.id}/like`, { method: 'POST' });
      setItem((cur) => ({ ...cur, likedByMe: data.liked, likesCount: data.likesCount }));
    } catch {
      setItem(prev);
    }
  }

  async function loadReplies() {
    if (replies || loadingReplies) return;
    setLoadingReplies(true);
    try {
      const data = await apiCall(`/api/comments/${item.id}/replies`);
      setReplies(data.replies);
    } finally {
      setLoadingReplies(false);
    }
  }

  // Optimistic: add the reply right away, reconcile with the saved row,
  // roll back with a message on failure.
  async function addReply(content) {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimistic = {
      id: tempId,
      postId: item.postId,
      parentId: String(item.id),
      content,
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      user: me,
      isMine: true,
      likedByMe: false,
      pending: true,
    };
    setReplies((cur) => [...(cur || []), optimistic]);
    setItem((cur) => ({ ...cur, repliesCount: cur.repliesCount + 1 }));
    setShowReplyBox(false);
    try {
      const reply = await apiCall(`/api/comments/${item.id}/replies`, {
        method: 'POST',
        body: { content },
      });
      setReplies((cur) => (cur || []).map((r) => (r.id === tempId ? reply : r)));
    } catch (err) {
      setReplies((cur) => (cur || []).filter((r) => r.id !== tempId));
      setItem((cur) => ({ ...cur, repliesCount: Math.max(0, cur.repliesCount - 1) }));
      window.alert(err?.message || 'Failed to add reply');
    }
  }

  return (
    <div className="_comment_main" style={item.pending ? { opacity: 0.55 } : undefined}>
      <div className="_comment_image">
        <a href="#0" className="_comment_image_link">
          <Avatar user={item.user} size="h-10 w-10" />
        </a>
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <a href="#0">
                <h4 className="_comment_name_title">
                  {item.user.firstName} {item.user.lastName}
                </h4>
              </a>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{item.content}</span>
            </p>
          </div>
          {item.likesCount > 0 && (
            <div
              className="_total_reactions"
              onClick={() => setShowLikes(true)}
              role="button"
              tabIndex={0}
              title="See who liked this"
            >
              <div className="_total_react">
                <span className="_reaction_like">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-thumbs-up">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                </span>
                <span className="_reaction_heart">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-heart">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </span>
              </div>
              <span className="_total">{item.likesCount}</span>
            </div>
          )}
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <span
                    onClick={toggleLike}
                    role="button"
                    tabIndex={0}
                    style={item.likedByMe ? { color: '#377DFF', fontWeight: 600 } : undefined}
                  >
                    {item.likedByMe ? 'Liked.' : 'Like.'}
                  </span>
                </li>
                {!isReply && (
                  <li>
                    <span
                      onClick={() => {
                        setShowReplyBox((v) => !v);
                        loadReplies();
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      Reply.
                    </span>
                  </li>
                )}
                <li>
                  <span>Share</span>
                </li>
                <li>
                  <span className="_time_link" style={{ whiteSpace: 'nowrap' }}>.{timeAgoShort(item.createdAt)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {!isReply && item.repliesCount > 0 && !replies && !loadingReplies && (
          <div className="_previous_comment">
            <button type="button" className="_previous_comment_txt" onClick={loadReplies}>
              View {item.repliesCount} repl{item.repliesCount > 1 ? 'ies' : 'y'}
            </button>
          </div>
        )}
        {loadingReplies && <CommentSkeleton />}
        {replies?.map((r) => (
          <CommentItem key={r.id} me={me} comment={r} isReply />
        ))}
        {showReplyBox && <CommentForm me={me} placeholder="Write a reply" onSubmit={addReply} autoFocus />}
      </div>
      {showLikes && <LikesModal targetType="comment" targetId={item.id} onClose={() => setShowLikes(false)} />}
    </div>
  );
}
