import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail, passwordIssues, isValidPassword } from './validation';
import { hashPassword, verifyPassword } from './password';
import { expiryFromNow, generateToken, hashToken, isExpired } from './tokens';

describe('email validation', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('  user@naijaxch.com ')).toBe(true);
  });
  it('rejects malformed addresses', () => {
    expect(isValidEmail('nope')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a @b.com')).toBe(false);
  });
  it('normalizes to trimmed lowercase', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
  });
});

describe('password rules', () => {
  it('flags weak passwords', () => {
    expect(passwordIssues('short')).toContain('Password must be at least 8 characters.');
    expect(passwordIssues('alllowercase1')).toContain('Add an uppercase letter.');
    expect(isValidPassword('NoNumbersHere')).toBe(false);
  });
  it('accepts a strong password', () => {
    expect(passwordIssues('Str0ngPass')).toEqual([]);
    expect(isValidPassword('Str0ngPass')).toBe(true);
  });
});

describe('password hashing', () => {
  it('hashes and verifies (roundtrip), rejects wrong password', async () => {
    const hash = await hashPassword('Str0ngPass');
    expect(hash).not.toContain('Str0ngPass');
    expect(await verifyPassword('Str0ngPass', hash)).toBe(true);
    expect(await verifyPassword('WrongPass1', hash)).toBe(false);
  });
});

describe('tokens', () => {
  it('hashToken is deterministic and not the raw token', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe('abc');
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
  });
  it('generateToken returns distinct URL-safe tokens', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it('isExpired compares against now', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    expect(isExpired(expiryFromNow(1000, now), now)).toBe(false);
    expect(isExpired(expiryFromNow(-1000, now), now)).toBe(true);
  });
});
