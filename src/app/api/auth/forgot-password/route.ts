/** Request a password-reset email. Always returns generic success (no enumeration). */

import { NextResponse } from 'next/server';
import { normalizeEmail, isValidEmail } from '@/auth/validation';
import { createAndSendReset } from '@/auth/reset';

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true });
  }
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';

  if (isValidEmail(email)) {
    try {
      await createAndSendReset(email);
    } catch {
      // swallow — never reveal state or log PII
    }
  }
  // Same response whether or not the account exists.
  return NextResponse.json({ ok: true });
}
