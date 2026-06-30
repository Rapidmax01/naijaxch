/**
 * Community thread API (proposal 0008). GET lists posts (public read); POST
 * creates a post (verified session + posting policy + validation/rate-limit).
 * Thin handler — gating/validation live in src/api (layering rule). The whole
 * feature is dark unless COMMUNITY_ENABLED is set (D-F).
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { communityEnabled, createPost, getPosterGate, listPosts } from '@/api';

const REJECT_STATUS: Record<string, number> = {
  empty: 400,
  'too-long': 400,
  'blocked-content': 422,
  'rate-limited': 429,
};

export async function GET(_request: Request, { params }: { params: { ticker: string } }) {
  if (!communityEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const session = await auth();
  const viewerId = session?.user?.id;
  const posts = await listPosts(params.ticker.toUpperCase(), viewerId);
  const canPost = viewerId ? (await getPosterGate(viewerId)).canPost : false;

  return NextResponse.json({ posts, canPost, signedIn: Boolean(viewerId) });
}

export async function POST(request: Request, { params }: { params: { ticker: string } }) {
  if (!communityEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gate = await getPosterGate(session.user.id);
  if (!gate.canPost) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { body?: unknown } | null;
  if (typeof body?.body !== 'string') {
    return NextResponse.json({ error: 'empty' }, { status: 400 });
  }

  const result = await createPost(params.ticker.toUpperCase(), session.user.id, body.body);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: REJECT_STATUS[result.reason] ?? 400 });
  }
  return NextResponse.json({ post: result.post }, { status: 201 });
}
