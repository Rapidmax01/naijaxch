import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail, passwordIssues, isValidPassword } from './validation';
import { hashPassword, verifyPassword } from './password';

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
