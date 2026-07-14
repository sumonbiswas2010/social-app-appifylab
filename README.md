# Buddy Script

Minimal social feed built with Next.js (App Router, JS), Sequelize + PostgreSQL, JWT auth (access/refresh in httpOnly cookies), Google OAuth, Cloudflare R2 for image uploads, and socket.io for realtime chat, notifications and live feed updates.

## Setup

1. Fill in `.env` (Postgres URL, JWT secrets, Google OAuth credentials, R2 credentials).
2. Install and create the tables:

```bash
npm install
npm run db:sync
npm run dev
```

App runs at http://localhost:3000.

`npm run dev` / `npm start` launch `server.js` — a custom Next.js server with socket.io attached (plain `next dev` would run the app without realtime features). Production: `npm run build` then `npm start`.

## Notes

- **Auth**: register/login issue a 15-minute access token and a 30-day refresh token (httpOnly, SameSite=Lax cookies). Middleware silently refreshes expired sessions on page loads; `apiCall` does the same for API calls.
- **Google login**: server-side OAuth code flow. Set the authorized redirect URI to `{APP_URL}/api/auth/google/callback`.
- **API shape**: every response is `{ success, message, data }`. Errors are thrown as `AppError` and converted centrally by `apiHandler`.
- **Privacy**: public posts visible to everyone, private posts only to their author (enforced on feed, comments and likes).
- **Scale**: cursor pagination on posts/comments, denormalized like/comment counters, composite indexes on hot query paths.
- **CORS**: APIs are same-app only — cross-origin mutations are rejected and no CORS headers are ever emitted.
- **Uploads**: images validated (type/size) and stored in R2; `R2_PUBLIC_URL` must point to the bucket's public domain.
- **Realtime**: sockets authenticate with the same `access_token` cookie (verified in `server.js`); each user joins a `user:<id>` room. New public posts broadcast to every other user (`post:new` + stored notification), chat messages/read receipts go to the two participants, typing indicators are relayed peer-to-peer without storage, and presence is tracked in-memory.
- **Chat**: Facebook-style dock popups on the feed (auto-open on incoming messages) plus a full messenger at `/messages`. 1:1 conversations are a unique ordered user pair; unread counts come from `readAt` on messages.
