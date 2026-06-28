/**
 * Data export (NDPA data-subject right). Returns everything we hold for the
 * signed-in user as a JSON download. Auth required.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrismaClient } from '@/data/prisma-store';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getPrismaClient();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, tier: true, emailVerified: true, createdAt: true },
  });
  const watchlist = await db.watchlistItem.findMany({
    where: { userId: session.user.id },
    select: { ticker: true, addedAt: true },
  });

  const payload = { account: user, watchlist };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="naijaxch-data.json"',
    },
  });
}
