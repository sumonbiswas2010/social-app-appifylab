'use client';

import { useEffect, useState } from 'react';
import { apiCall } from '@/lib/apiCall';
import { REACTIONS } from '@/lib/reactions';
import Avatar from './Avatar';
import { CommentSkeleton } from './Shimmer';

export default function LikesModal({ targetType, targetId, onClose }) {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    apiCall(`/api/${targetType}s/${targetId}/likes`)
      .then((data) => setUsers(data.users))
      .catch(() => setUsers([]));
  }, [targetType, targetId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-md bg-white p-5 dark:bg-dcard"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h5 className="font-semibold">Likes</h5>
          <button
            type="button"
            onClick={onClose}
            className="text-xl text-muted transition hover:text-ink dark:hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {!users && (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        )}
        {users?.length === 0 && <p className="text-sm text-muted dark:text-gray-400">No likes yet</p>}
        {users?.map((u) => (
          <div className="flex items-center gap-3 py-2" key={u.id}>
            <span className="relative">
              <Avatar user={u} size="h-9 w-9" textSize="text-xs" />
              <span
                className="absolute -bottom-1 -right-1 text-sm"
                title={REACTIONS[u.reaction]?.label || 'Like'}
              >
                {REACTIONS[u.reaction]?.emoji || '👍'}
              </span>
            </span>
            <span className="text-sm">
              {u.firstName} {u.lastName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
