/**
 * One-time token helpers for email verification + password reset.
 * The raw token goes in the emailed link; only its SHA-256 hash is stored, so a
 * DB leak can't be replayed (G4). Pure functions where possible (testable).
 */

import crypto from 'node:crypto';

/** URL-safe random token for an email link. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** Deterministic hash for storage/lookup — never store the raw token. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isExpired(expires: Date, now: Date = new Date()): boolean {
  return expires.getTime() <= now.getTime();
}

export function expiryFromNow(ms: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + ms);
}

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export const RESET_TTL_MS = 60 * 60 * 1000; // 1h
