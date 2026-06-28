/**
 * Merge a browser-local watchlist into the signed-in account (called once on
 * login). Idempotent union; capped to avoid abuse.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { mergeWatchlist } from '@/api';

const MAX_MERGE = 200;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { tickers?: unknown } | null;
  const tickers = Array.isArray(body?.tickers)
    ? body!.tickers
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim().toUpperCase())
        .slice(0, MAX_MERGE)
    : [];

  await mergeWatchlist(session.user.id, tickers);
  return NextResponse.json({ ok: true });
}
