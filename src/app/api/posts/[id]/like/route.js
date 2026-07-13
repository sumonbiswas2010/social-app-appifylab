import { apiHandler } from '@/lib/errors';
import { ok } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getVisiblePost, toggleLike } from '@/lib/social';
import { isReaction } from '@/lib/reactions';

// POST /api/posts/[id]/like — { type? } react / switch / un-react.
// Same type again removes the reaction, a different type switches it.
export const POST = apiHandler(async (req, { params }) => {
  const me = await requireAuth();
  const { id } = await params;
  const post = await getVisiblePost(id, me.id);
  const body = await req.json().catch(() => ({}));
  const type = isReaction(body?.type) ? body.type : 'like';
  const result = await toggleLike(me.id, 'post', post, type);
  return ok(result);
});
