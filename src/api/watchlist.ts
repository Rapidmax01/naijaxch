/**
 * Account-bound watchlist service (persists to watchlist_items). Used by the
 * watchlist API routes once a user is authenticated; logged-out users keep the
 * browser-local list (G4 — minimal PII, just ticker symbols).
 */

import { getPrismaClient } from '@/data/prisma-store';

export async function getWatchlist(userId: string): Promise<string[]> {
  const items = await getPrismaClient().watchlistItem.findMany({
    where: { userId },
    orderBy: { addedAt: 'asc' },
    select: { ticker: true },
  });
  return items.map((i) => i.ticker);
}

export async function addToWatchlist(userId: string, ticker: string): Promise<void> {
  await getPrismaClient().watchlistItem.upsert({
    where: { userId_ticker: { userId, ticker } },
    create: { userId, ticker },
    update: {},
  });
}

export async function removeFromWatchlist(userId: string, ticker: string): Promise<void> {
  await getPrismaClient().watchlistItem.deleteMany({ where: { userId, ticker } });
}

/** Merge a set of tickers (e.g. from localStorage) into the account, idempotently. */
export async function mergeWatchlist(userId: string, tickers: string[]): Promise<void> {
  const unique = [...new Set(tickers)];
  if (unique.length === 0) return;
  await getPrismaClient().watchlistItem.createMany({
    data: unique.map((ticker) => ({ userId, ticker })),
    skipDuplicates: true,
  });
}
