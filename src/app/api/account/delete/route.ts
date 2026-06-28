/**
 * Account deletion (NDPA erasure). Removes the user; cascades delete accounts,
 * sessions, watchlist items, and reset tokens. Auth required. The client signs
 * out afterwards.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrismaClient } from '@/data/prisma-store';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await getPrismaClient().user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ ok: true });
}
