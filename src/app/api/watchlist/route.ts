/**
 * Account-bound watchlist API (auth required). Thin handlers delegating to the
 * service (layering rule). Tickers only — no other PII (G4).
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addToWatchlist, getWatchlist, removeFromWatchlist } from '@/api';

async function tickerFrom(request: Request): Promise<string | null> {
  const body = (await request.json().catch(() => null)) as { ticker?: unknown } | null;
  return typeof body?.ticker === 'string' && body.ticker.trim() ? body.ticker.trim().toUpperCase() : null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ tickers: await getWatchlist(session.user.id) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ticker = await tickerFrom(request);
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 });
  await addToWatchlist(session.user.id, ticker);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ticker = await tickerFrom(request);
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 });
  await removeFromWatchlist(session.user.id, ticker);
  return NextResponse.json({ ok: true });
}
