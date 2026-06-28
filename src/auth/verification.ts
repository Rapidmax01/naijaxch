/**
 * Email verification. Stores a hashed token in verification_tokens keyed by the
 * user's email; the raw token rides in the emailed link. Soft enforcement —
 * unverified users can still use the free tier (a banner prompts them).
 */

import { getPrismaClient } from '@/data/prisma-store';
import { expiryFromNow, generateToken, hashToken, isExpired, VERIFICATION_TTL_MS } from './tokens';
import { sendEmail, verificationEmail } from './email';

export async function createAndSendVerification(email: string): Promise<void> {
  const db = getPrismaClient();
  const token = generateToken();
  await db.verificationToken.deleteMany({ where: { identifier: email } });
  await db.verificationToken.create({
    data: { identifier: email, token: hashToken(token), expires: expiryFromNow(VERIFICATION_TTL_MS) },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const url = `${base}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const { subject, html } = verificationEmail(url);
  await sendEmail({ to: email, subject, html });
}

/** Returns true if the token is valid; marks the user verified and clears tokens. */
export async function verifyEmailToken(email: string, token: string): Promise<boolean> {
  const db = getPrismaClient();
  const row = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: hashToken(token) } },
  });
  if (!row || isExpired(row.expires)) return false;

  await db.user.update({ where: { email }, data: { emailVerified: new Date() } });
  await db.verificationToken.deleteMany({ where: { identifier: email } });
  return true;
}
