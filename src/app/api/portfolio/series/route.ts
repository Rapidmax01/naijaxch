/**
 * Thin route handler — delegates to the portfolio service (src/api). Takes a
 * manually-entered holdings list and returns the aggregated portfolio adjusted
 * series. No holdings are persisted (no auth/DB in Phase-1 scaffold); the body
 * is transient and never logged (G4).
 */

import { NextResponse } from 'next/server';
import { getPortfolioSeries } from '@/api';
import type { Holding } from '@/series';

interface Body {
  holdings?: unknown;
}

function parseHoldings(input: unknown): Holding[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (h): h is { ticker: string; quantity: number } =>
        typeof h === 'object' &&
        h !== null &&
        typeof (h as Record<string, unknown>).ticker === 'string' &&
        typeof (h as Record<string, unknown>).quantity === 'number',
    )
    .map((h) => ({ ticker: h.ticker.toUpperCase(), quantity: h.quantity }));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body || !Array.isArray(body.holdings)) {
    return NextResponse.json(
      { error: 'Expected { holdings: [{ ticker, quantity }] }' },
      { status: 400 },
    );
  }

  const series = await getPortfolioSeries(parseHoldings(body.holdings));
  return NextResponse.json(series);
}
