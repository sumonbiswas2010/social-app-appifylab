// Bridge from API routes to the socket.io server created in server.js.
// Emits are best-effort: realtime failures must never fail the HTTP request.

export function getIO() {
  return globalThis.__io || null;
}

export function emitToUser(userId, event, payload) {
  try {
    getIO()?.to(`user:${userId}`).emit(event, payload);
  } catch (err) {
    console.error('socket emit failed', err);
  }
}

// Everyone except the given user's sockets (e.g. broadcast a new public post)
export function emitToOthers(userId, event, payload) {
  try {
    getIO()?.except(`user:${userId}`).emit(event, payload);
  } catch (err) {
    console.error('socket emit failed', err);
  }
}
