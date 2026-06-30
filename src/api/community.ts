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

/**
 * Posting policy (0008, D-A). The spec's freemium table implies premium-only
 * posting; we default to "any verified member can post" so the discussion has
 * seed content at launch. Flip this one constant to honour the spec's gate.
 */
const REQUIRE_PREMIUM_TO_POST = false;

export type PosterGate = { canPost: true } | { canPost: false; reason: 'unverified' | 'premium-required' | 'unknown-user' };

/** Can this user post? Verified account required; premium gate is config (D-A). */
export async function getPosterGate(userId: string): Promise<PosterGate> {
  const u = await getPrismaClient().user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, tier: true },
  });
  if (!u) return { canPost: false, reason: 'unknown-user' };
  if (!u.emailVerified) return { canPost: false, reason: 'unverified' };
  if (REQUIRE_PREMIUM_TO_POST && u.tier !== 'premium') return { canPost: false, reason: 'premium-required' };
  return { canPost: true };
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const u = await getPrismaClient().user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return Boolean(u?.isAdmin);
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

export interface ModItem {
  reportId: string;
  postId: string;
  reason: string;
  reportedAt: string;
  ticker: string;
  author: string;
  body: string;
  postStatus: PostStatus;
}

/** Open reports with their post context (admin-gated by the caller). */
export async function listModerationQueue(): Promise<ModItem[]> {
  const rows = await getPrismaClient().postReport.findMany({
    where: { status: 'open' },
    orderBy: { createdAt: 'asc' },
    take: 200,
    include: { post: { include: { user: { select: { name: true } } } } },
  });
  return rows.map((r) => ({
    reportId: r.id,
    postId: r.postId,
    reason: r.reason,
    reportedAt: r.createdAt.toISOString(),
    ticker: r.post.ticker,
    author: r.post.user.name ?? 'Member',
    body: r.post.body,
    postStatus: r.post.status as PostStatus,
  }));
}

export type ModAction = 'hide' | 'remove' | 'dismiss';

/** Resolve a report: hide/remove the post (and close its open reports), or dismiss. */
export async function moderate(reportId: string, action: ModAction): Promise<boolean> {
  const db = getPrismaClient();
  const report = await db.postReport.findUnique({ where: { id: reportId } });
  if (!report) return false;

  if (action === 'dismiss') {
    await db.postReport.update({ where: { id: reportId }, data: { status: 'dismissed' } });
    return true;
  }

  const status: PostStatus = action === 'hide' ? 'hidden' : 'removed';
  await db.$transaction([
    db.communityPost.update({ where: { id: report.postId }, data: { status } }),
    db.postReport.updateMany({ where: { postId: report.postId, status: 'open' }, data: { status: 'actioned' } }),
  ]);
  return true;
}
