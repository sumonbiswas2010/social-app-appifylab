import { NextResponse } from 'next/server';
import { apiHandler, AppError } from '@/lib/errors';
import { requireAuth, publicUser } from '@/lib/auth';
import { authorizeChannel } from '@/lib/live';

// POST /api/pusher/auth — signs private/presence channel subscriptions.
// pusher-js posts { socket_id, channel_name } as form data; the httpOnly
// access_token cookie identifies the user. Returns Pusher's raw auth object.
export const POST = apiHandler(async (req) => {
  const me = await requireAuth();

  const form = await req.formData();
  const socketId = form.get('socket_id');
  const channel = form.get('channel_name');
  if (!socketId || !channel) throw new AppError('Bad auth request', 400);

  // A user may only join their own private channel.
  if (channel.startsWith('private-user-')) {
    if (channel !== `private-user-${me.id}`) throw new AppError('Forbidden', 403);
    return NextResponse.json(authorizeChannel(socketId, channel));
  }

  // Everyone may join the shared presence channel; membership = online users.
  if (channel === 'presence-online') {
    return NextResponse.json(
      authorizeChannel(socketId, channel, {
        user_id: String(me.id),
        user_info: publicUser(me),
      })
    );
  }

  throw new AppError('Forbidden', 403);
});
