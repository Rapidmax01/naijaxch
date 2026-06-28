/**
 * Password reset. Stores a hashed, single-use, time-limited token. Requests for
 * unknown emails are silent (no account enumeration; G4).
 */

import { getPrismaClient } from '@/data/prisma-store';
import { hashPassword } from './password';
import { expiryFromNow, generateToken, hashToken, isExpired, RESET_TTL_MS } from './tokens';
import { passwordResetEmail, sendEmail } from './email';

/** Create + email a reset link if the account exists; otherwise do nothing. */
export async function createAndSendReset(email: string): Promise<void> {
  const db = getPrismaClient();
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return; // silent — no enumeration

  const token = generateToken();
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expires: expiryFromNow(RESET_TTL_MS) },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const url = `${base}/reset-password?token=${token}&id=${user.id}`;
  const { subject, html } = passwordResetEmail(url);
  await sendEmail({ to: email, subject, html });
}

/** Returns true if the token was valid + unused; sets the new password. */
export async function resetPassword(
  userId: string,
  token: string,
  newPassword: string,
): Promise<boolean> {
  const db = getPrismaClient();
  const row = await db.passwordResetToken.findFirst({
    where: { userId, tokenHash: hashToken(token), usedAt: null },
    orderBy: { expires: 'desc' },
  });
  if (!row || isExpired(row.expires)) return false;

  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
  await db.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return true;
}
