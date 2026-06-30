/**
 * Report a community post (proposal 0008). Verified session required; the report
 * lands in the moderation queue. Idempotent per (post, user). Thin handler.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { communityEnabled, reportPost } from '@/api';

export async function POST(request: Request) {
  if (!communityEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { postId?: unknown; reason?: unknown } | null;
  if (typeof body?.postId !== 'string' || typeof body?.reason !== 'string') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const ok = await reportPost(body.postId, session.user.id, body.reason);
  if (!ok) return NextResponse.json({ error: 'invalid-reason' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
