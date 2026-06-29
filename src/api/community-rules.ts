/**
 * Pure community-post rules (proposal 0008) — no I/O, fully unit-tested.
 *
 * These gate user-generated content before it is stored: length, a basic
 * spam/contact blocklist (G4 — no links or contact details), and a per-user
 * rate limit. Deterministic, so they're testable without a DB. NOT an LLM
 * arbiter (that would pull in gate #4); just cheap, predictable checks.
 */

export const MAX_POST_LENGTH = 500;
export const RATE_LIMIT = 5; // posts...
export const RATE_WINDOW_MS = 10 * 60_000; // ...per 10 minutes

export type PostRejectReason = 'empty' | 'too-long' | 'blocked-content';

/** Links + contact details we block pre-publish (spam / PII — G4, guideline 5). */
const BLOCKED_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /\bwww\.\S+/i,
  /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/, // email
  /\b(?:\+?234|0)\d{9,10}\b/, // NG phone number
  /\bwhats\s?app\b/i,
  /\btelegram\b/i,
];

export type ValidBody = { ok: true; body: string };
export type InvalidBody = { ok: false; reason: PostRejectReason };

/** Trim + validate a post body. Returns the cleaned body or a reject reason. */
export function validatePostBody(body: string): ValidBody | InvalidBody {
  const trimmed = body.trim();
  if (trimmed.length === 0) return { ok: false, reason: 'empty' };
  if (trimmed.length > MAX_POST_LENGTH) return { ok: false, reason: 'too-long' };
  if (BLOCKED_PATTERNS.some((re) => re.test(trimmed))) return { ok: false, reason: 'blocked-content' };
  return { ok: true, body: trimmed };
}

/** True if a new post is allowed given the user's recent post timestamps (ms). */
export function withinRateLimit(
  recentMs: number[],
  nowMs: number,
  limit = RATE_LIMIT,
  windowMs = RATE_WINDOW_MS,
): boolean {
  const inWindow = recentMs.filter((t) => nowMs - t < windowMs);
  return inWindow.length < limit;
}

/** Report reasons offered to users (labels live in the UI / copy draft). */
export const REPORT_REASONS = [
  'advice',
  'manipulation',
  'spam',
  'abuse',
  'personal-info',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export function isValidReportReason(reason: string): reason is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(reason);
}
