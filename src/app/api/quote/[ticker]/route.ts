/**
 * Thin route handler — delegates to the API service layer (src/api). No data or
 * business logic here (layering rule). Serves the delayed/EOD quote badge value.
 *
 * Display-only and always labelled with its delay (G3). A short cache (60s)
 * keeps this a *display* refresh, not a tick stream — Phase 1 is delayed/EOD.
 */

import { NextResponse } from 'next/server';
import { getDelayedQuote } from '@/api';

export async function GET(
  _request: Request,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const quote = await getDelayedQuote(ticker);

  if (!quote) {
    return NextResponse.json({ error: 'Unknown ticker' }, { status: 404 });
  }

  return NextResponse.json(quote, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' },
  });
}
