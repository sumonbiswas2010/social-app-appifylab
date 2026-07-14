// Bridge from API routes to Pusher Channels.
// Emits are best-effort: realtime failures must never fail the HTTP request.
//
// Channels:
//   private-user-<id>  targeted events for one user (chat, notifications, typing)
//   feed               public stream of new posts to every client
//   presence-online    presence membership = who is online (client-tracked)
import Pusher from 'pusher';

// Reused across warm serverless invocations.
let pusher = null;
function client() {
  if (!pusher) {
    pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusher;
}

async function trigger(channel, event, payload) {
  try {
    await client().trigger(channel, event, payload);
  } catch (err) {
    console.error('pusher trigger failed', err);
  }
}

export function emitToUser(userId, event, payload) {
  return trigger(`private-user-${userId}`, event, payload);
}

// Broadcast to everyone; the author's own client ignores it via _authorId
// (it already has the post from the create response).
export function emitToOthers(userId, event, payload) {
  return trigger('feed', event, { ...payload, _authorId: String(userId) });
}

// Sign a private/presence subscription for the Pusher auth endpoint.
export function authorizeChannel(socketId, channel, presenceData) {
  return client().authorizeChannel(socketId, channel, presenceData);
}
