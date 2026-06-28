/**
 * Account-bound portfolio holdings (persists to the holdings table). Quantities
 * are stored NUMERIC and converted to number at the boundary; the portfolio
 * trend still computes via the engine (buildPortfolioSeries).
 */

import { getPrismaClient } from '@/data/prisma-store';

export interface AccountHolding {
  ticker: string;
  quantity: number;
}

export async function getHoldings(userId: string): Promise<AccountHolding[]> {
  const rows = await getPrismaClient().holding.findMany({
    where: { userId },
    orderBy: { ticker: 'asc' },
  });
  return rows.map((r) => ({ ticker: r.ticker, quantity: r.quantity.toNumber() }));
}

/** Replace the user's whole holdings set (the builder saves the full list). */
export async function replaceHoldings(
  userId: string,
  holdings: AccountHolding[],
): Promise<void> {
  const seen = new Set<string>();
  const clean: { userId: string; ticker: string; quantity: number }[] = [];
  for (const h of holdings) {
    const ticker = typeof h.ticker === 'string' ? h.ticker.trim().toUpperCase() : '';
    if (!ticker || seen.has(ticker)) continue;
    if (!(h.quantity > 0)) continue;
    seen.add(ticker);
    clean.push({ userId, ticker, quantity: h.quantity });
  }

  const db = getPrismaClient();
  await db.$transaction([
    db.holding.deleteMany({ where: { userId } }),
    ...(clean.length > 0 ? [db.holding.createMany({ data: clean })] : []),
  ]);
}
