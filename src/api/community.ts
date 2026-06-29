/**
 * Community service (proposal 0008) — per-company discussion, persisted.
 *
 * UGC guardrails: posts are individual opinions, never advice (G2) and never
 * mixed into our computed surfaces (G1). We expose a DISPLAY NAME only, never an
 * email (G4); bodies/identifiers are never logged. The whole feature is behind a
 * default-off flag until the legal review (proposal 0008, D-F) clears.
 */

import { getPrismaClient } from '@/data/prisma-store';
import {
  isValidReportReason,
  validatePostBody,
  withinRateLimit,
  RATE_WINDOW_MS,
} from './community-rules';

/** Master switch — community stays dark until launch is approved (D-F). */
export function communityEnabled(): boolean {
  const v = (process.env.COMMUNITY_ENABLED ?? '').toLowerCase();
  return v === '1' || v === 'true';
}

export type PostStatus = 'visible' | 'hidden' | 'removed';

export interface CommunityPost {
  id: string;
  ticker: string;
  /** Display name only — never the email (G4). 'Member' when hidden/unknown. */
  author: string;
  body: string;
  createdAt: string; // ISO
  status: PostStatus;
  /** True when this post belongs to the viewer (enables delete in the UI). */
  mine: boolean;
}

function toView(
  row: { id: string; ticker: string; body: string; status: string; createdAt: Date; user: { id: string; name: string | null } },
  viewerId?: string,
): CommunityPost {
  const status = row.status as PostStatus;
  const visible = status === 'visible';
  return {
    id: row.id,
    ticker: row.ticker,
    author: visible ? row.user.name ?? 'Member' : 'Member',
    body: visible ? row.body : '',
    createdAt: row.createdAt.toISOString(),
    status,
    mine: !!viewerId && row.user.id === viewerId,
  };
}

/** Newest-first posts for a ticker. Removed posts are omitted; hidden show as a tombstone. */
export async function listPosts(ticker: string, viewerId?: string): Promise<CommunityPost[]> {
  const rows = await getPrismaClient().communityPost.findMany({
    where: { ticker: ticker.toUpperCase(), status: { in: ['visible', 'hidden'] } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { id: true, name: true } } },
  });
  return rows.map((r) => toView(r, viewerId));
}

export type CreateResult =
  | { ok: true; post: CommunityPost }
  | { ok: false; reason: 'empty' | 'too-long' | 'blocked-content' | 'rate-limited' };

/** Create a post after validation + rate-limit. Caller has already auth/tier-gated. */
export async function createPost(ticker: string, userId: string, body: string): Promise<CreateResult> {
  const v = validatePostBody(body);
  if (!v.ok) return { ok: false, reason: v.reason };

  const db = getPrismaClient();
  const since = new Date(Date.now() - RATE_WINDOW_MS);
  const recent = await db.communityPost.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  if (!withinRateLimit(recent.map((r) => r.createdAt.getTime()), Date.now())) {
    return { ok: false, reason: 'rate-limited' };
  }

  const row = await db.communityPost.create({
    data: { ticker: ticker.toUpperCase(), userId, body: v.body },
    include: { user: { select: { id: true, name: true } } },
  });
  return { ok: true, post: toView(row, userId) };
}

/** Soft-remove the viewer's own post (G4 — users control their content). */
export async function deleteOwnPost(postId: string, userId: string): Promise<boolean> {
  const res = await getPrismaClient().communityPost.updateMany({
    where: { id: postId, userId },
    data: { status: 'removed' },
  });
  return res.count > 0;
}

/** Flag a post. Idempotent: a duplicate report by the same user is a no-op. */
export async function reportPost(postId: string, reporterId: string, reason: string): Promise<boolean> {
  if (!isValidReportReason(reason)) return false;
  try {
    await getPrismaClient().postReport.create({ data: { postId, reporterId, reason } });
  } catch {
    // Unique (postId, reporterId) violation → already reported; treat as success.
  }
  return true;
}

/** Moderator action (admin-gated by the caller): hide / remove / restore a post. */
export async function setPostStatus(postId: string, status: PostStatus): Promise<void> {
  await getPrismaClient().communityPost.update({ where: { id: postId }, data: { status } });
}
