/**
 * Sign-up (email/password). Auth.js doesn't create credential users, so we do:
 * validate → check existing → hash → create → send Brevo verification email.
 * The client then calls signIn() to establish the session.
 *
 * GUARDRAIL G4: never log the email/password/hash. Generic responses avoid
 * leaking whether an address is already registered (no account enumeration).
 */

import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/data/prisma-store';
import { hashPassword } from '@/auth/password';
import { isValidEmail, normalizeEmail, passwordIssues } from '@/auth/validation';
import { sendEmail, verificationEmail } from '@/auth/email';

interface Body {
  email?: unknown;
  password?: unknown;
  name?: unknown;
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Accounts are not available yet.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : null;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  const pwIssues = passwordIssues(password);
  if (pwIssues.length > 0) {
    return NextResponse.json({ error: pwIssues.join(' ') }, { status: 400 });
  }

  const db = getPrismaClient();
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    // Don't reveal that the address is taken — generic success-shaped response.
    return NextResponse.json({ ok: true });
  }

  const passwordHash = await hashPassword(password);
  await db.user.create({ data: { email, passwordHash, name } });

  // Best-effort verification email (Step 3b enforces verification).
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const { subject, html } = verificationEmail(`${base}/login`);
    await sendEmail({ to: email, subject, html });
  } catch {
    // Never fail signup on email transport issues; don't log PII.
  }

  return NextResponse.json({ ok: true });
}
