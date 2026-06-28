/**
 * Pure auth input validation. No I/O — unit-testable. Used by signup and the
 * Credentials provider before any DB work. Keeps PII handling minimal (G4).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Returns a list of human-readable problems; empty array = valid. */
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push('Password must be at least 8 characters.');
  if (!/[a-z]/.test(password)) issues.push('Add a lowercase letter.');
  if (!/[A-Z]/.test(password)) issues.push('Add an uppercase letter.');
  if (!/[0-9]/.test(password)) issues.push('Add a number.');
  return issues;
}

export function isValidPassword(password: string): boolean {
  return passwordIssues(password).length === 0;
}
