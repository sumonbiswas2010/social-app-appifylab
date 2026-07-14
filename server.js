// Custom server: Next.js + socket.io on one HTTP server.
// API routes run in this same process, so they can emit through globalThis.__io
// (see src/lib/live.js).
import 'dotenv/config';
import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { jwtVerify } from 'jose';

if (process.argv.includes('--prod')) process.env.NODE_ENV = 'production';
const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev });
const handler = app.getRequestHandler();

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// Sockets authenticate with the same httpOnly access_token cookie the APIs use
async function userIdFromHandshake(socket) {
  const token = parseCookies(socket.handshake.headers.cookie).access_token;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_ACCESS_SECRET));
    return String(payload.sub);
  } catch {
    return null;
  }
}

app.prepare().then(() => {
  const server = createServer(handler);
  const io = new Server(server, { serveClient: false });

  io.use(async (socket, done) => {
    const userId = await userIdFromHandshake(socket);
    if (!userId) return done(new Error('unauthorized'));
    socket.data.userId = userId;
    done();
  });

  // userId -> live socket count, for presence
  const online = new Map();
  const onlineIds = () => [...online.keys()];

  io.on('connection', (socket) => {
    const uid = socket.data.userId;
    socket.join(`user:${uid}`);

    online.set(uid, (online.get(uid) || 0) + 1);
    if (online.get(uid) === 1) socket.broadcast.emit('presence:update', onlineIds());
    socket.emit('presence:update', onlineIds());

    // Typing indicators are relayed peer-to-peer, never stored
    socket.on('chat:typing', (data = {}) => {
      if (!data.toUserId) return;
      socket.to(`user:${data.toUserId}`).emit('chat:typing', {
        conversationId: String(data.conversationId || ''),
        fromUserId: uid,
        typing: !!data.typing,
      });
    });

    socket.on('disconnect', () => {
      const left = (online.get(uid) || 1) - 1;
      if (left <= 0) {
        online.delete(uid);
        socket.broadcast.emit('presence:update', onlineIds());
      } else {
        online.set(uid, left);
      }
    });
  });

  globalThis.__io = io;

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} (socket.io attached)`);
  });
});
