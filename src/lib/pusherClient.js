import PusherClient from 'pusher-js';

// One Pusher connection per browser tab, shared by every component.
let pusher = null;

// Custom authorizer for private/presence channels. Uses the httpOnly
// access_token cookie (sent automatically, same-origin). If it has expired,
// refresh the cookie once and retry — mirrors the old socket reconnect flow.
function authorizer(channel) {
  return {
    async authorize(socketId, callback) {
      const body = () =>
        new URLSearchParams({ socket_id: socketId, channel_name: channel.name });
      try {
        let res = await fetch('/api/pusher/auth', { method: 'POST', body: body() });
        if (res.status === 401) {
          await fetch('/api/auth/refresh', { method: 'POST' }).catch(() => {});
          res = await fetch('/api/pusher/auth', { method: 'POST', body: body() });
        }
        if (!res.ok) return callback(new Error('pusher auth failed'), null);
        callback(null, await res.json());
      } catch (err) {
        callback(err, null);
      }
    },
  };
}

export function getPusher() {
  if (!pusher) {
    pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authorizer,
    });
  }
  return pusher;
}
