'use client';

// Small transient popups (new post / new message notices)
export default function Toasts({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="_toast_stack">
      {toasts.map((t) => (
        <div key={t.id} className="_toast_item" role="status" onClick={() => dismiss(t.id)}>
          <span className="_toast_dot" />
          <p className="_toast_text">{t.text}</p>
          <button
            type="button"
            className="_toast_close"
            aria-label="Dismiss"
            onClick={(e) => {
              e.stopPropagation();
              dismiss(t.id);
            }}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
