# Buddy Script

A minimal social feed built from a provided HTML/CSS template (Login, Register, Feed) and turned into a full-stack **Next.js 15** application: text/image posts with public/private visibility, Facebook-style reactions, nested comments and replies, realtime 1:1 chat, live notifications, and presence — all with production-minded auth, security and query performance.

**Stack:** Next.js 15 (App Router, JS) · Sequelize + PostgreSQL · JWT auth (access/refresh in httpOnly cookies) · Google OAuth · Cloudflare R2 for images · **Pusher Channels** for realtime.

## Features

- **Auth** — email/password register & login plus Google OAuth. 15-minute access token + 30-day refresh token in httpOnly cookies; sessions refresh silently on both page loads (middleware) and API calls (`apiCall`).
- **Feed** — protected route; public posts visible to everyone, private posts only to their author. Create posts with text and/or an image, newest first, cursor-paginated. New public posts from others appear live.
- **Reactions** — six Facebook-style reactions (like/love/haha/wow/sad/angry) on posts *and* comments, with a "who reacted" modal.
- **Comments** — top-level comments plus one level of replies, each with its own reactions and counts.
- **Chat** — realtime 1:1 messaging with Facebook-style dock popups on the feed (auto-open on incoming) and a full messenger at `/messages`. Typing indicators, "Seen" read receipts, unread badges, presence dots.
- **Notifications** — every new public post fans out a stored notification to all other users, delivered live to a navbar bell and a toast.
- **Dark mode** — persisted, applied before first paint (no flash).

## Setup

1. Create a `.env` (see variables below).
2. Install, create the tables, and run:

```bash
npm install
npm run db:sync   # sequelize.sync({ alter: true }) — creates/updates all tables
npm run dev       # http://localhost:3000
```

Production: `npm run build` then `npm start`.

### Environment variables

```
DATABASE_URL=postgres://user:pass@host:5432/dbname
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

PUSHER_APP_ID=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=...

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_URL=https://<your-public-bucket-domain>
```

- **Google login**: set the authorized redirect URI to `{APP_URL}/api/auth/google/callback`.
- **Realtime**: the app runs without Pusher credentials, but live updates won't push — posts, chat and notifications still persist and appear on reload.

## How it works (short version)

- **API shape** — every response is `{ success, message, data }`. Errors are thrown as `AppError` and converted centrally by `apiHandler`; the client `apiCall` unwraps `data` and handles token refresh.
- **Privacy** — public posts visible to everyone, private posts only to their author, re-checked on feed, comments and likes (`getVisiblePost`).
- **Scale** — cursor pagination on every list, denormalized like/comment/reply counters, composite indexes on hot query paths, batched per-page annotation queries (no N+1). BIGINT ids serialized as strings.
- **CORS** — APIs are same-app only; cross-origin mutations are rejected and no CORS headers are ever emitted.
- **Uploads** — images are type/size-validated (jpeg/png/webp/gif, ≤5 MB) and stored in Cloudflare R2.
- **Realtime** — mutations persist to Postgres first, then the server triggers a Pusher event. Channels: `feed` (new public posts), `private-user-<id>` (chat, read receipts, notifications, typing), and the `presence-online` presence channel (whose membership is the online-user set). Channel subscriptions are signed by `POST /api/pusher/auth` using the same access-token cookie, so a user can only join their own private channel.
- **Chat model** — a conversation is a unique *ordered* user pair (`userOneId < userTwoId`), so two people ever have exactly one; unread counts come from `readAt IS NULL` on messages.

## Project layout

```
src/app/            App Router pages + /api route handlers
src/lib/            db, models, auth, realtime bridge, validators, serializers
src/components/     Feed, Navbar, sidebars, PostCard, chat/ (provider, dock, hooks)
public/assets/      Provided template CSS/images + custom chat-dock.css
scripts/db-sync.js  Table creation/migration from models
```

Built as a job-interview take-home; requirements are in `requirements.md`.
