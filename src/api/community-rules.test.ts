import { describe, expect, it } from 'vitest';
import {
  isValidReportReason,
  validatePostBody,
  withinRateLimit,
  MAX_POST_LENGTH,
  RATE_LIMIT,
} from './community-rules';

describe('validatePostBody', () => {
  it('accepts and trims a normal post', () => {
    expect(validatePostBody('  Solid dividend cover this year.  ')).toEqual({
      ok: true,
      body: 'Solid dividend cover this year.',
    });
  });

  it('rejects empty / whitespace-only', () => {
    expect(validatePostBody('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects over-length posts', () => {
    expect(validatePostBody('x'.repeat(MAX_POST_LENGTH + 1))).toEqual({
      ok: false,
      reason: 'too-long',
    });
  });

  it('blocks links and contact details (spam / PII — G4)', () => {
    const blocked = { ok: false, reason: 'blocked-content' };
    expect(validatePostBody('see http://pump.example')).toMatchObject(blocked);
    expect(validatePostBody('visit www.tips.ng now')).toMatchObject(blocked);
    expect(validatePostBody('mail me at a@b.com')).toMatchObject(blocked);
    expect(validatePostBody('call 08031234567')).toMatchObject(blocked);
    expect(validatePostBody('join my whatsapp group')).toMatchObject(blocked);
    expect(validatePostBody('dm on telegram')).toMatchObject(blocked);
  });
});

describe('withinRateLimit', () => {
  const now = 1_000_000;
  it('allows when under the limit in the window', () => {
    expect(withinRateLimit([now - 1000, now - 2000], now)).toBe(true);
  });
  it('blocks when at the limit within the window', () => {
    const recent = Array.from({ length: RATE_LIMIT }, (_, i) => now - i * 1000);
    expect(withinRateLimit(recent, now)).toBe(false);
  });
  it('ignores timestamps outside the window', () => {
    const old = Array.from({ length: RATE_LIMIT }, () => now - 60 * 60_000); // 1h ago
    expect(withinRateLimit(old, now)).toBe(true);
  });
});

describe('isValidReportReason', () => {
  it('accepts known reasons and rejects others', () => {
    expect(isValidReportReason('manipulation')).toBe(true);
    expect(isValidReportReason('advice')).toBe(true);
    expect(isValidReportReason('nonsense')).toBe(false);
  });
});
