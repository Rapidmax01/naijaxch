/**
 * Premium access checks. The source of truth is `users.tier` in the DB (flipped
 * by the webhook), not the JWT — so an upgrade takes effect without re-login.
 */

import { auth } from '@/auth';
import { getPrismaClient } from '@/data/prisma-store';

export async function getTier(userId: string): Promise<string> {
  if (!process.env.DATABASE_URL) return 'free';
  const user = await getPrismaClient().user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });
  return user?.tier ?? 'free';
}

/** True if the current session's user is on the premium tier. */
export async function isPremium(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  return (await getTier(session.user.id)) === 'premium';
}
