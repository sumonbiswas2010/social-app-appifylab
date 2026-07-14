import { io } from 'socket.io-client';

// One socket per browser tab, shared by every component through ChatProvider
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io({ withCredentials: true });
    socket.on('connect_error', (err) => {
      // Access token expired between page loads: refresh the cookie and let
      // socket.io's automatic reconnection pick up the new one
      if (err?.message === 'unauthorized') {
        fetch('/api/auth/refresh', { method: 'POST' }).catch(() => {});
      }
    });
  }
  return socket;
}
