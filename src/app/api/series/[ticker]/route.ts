/**
 * Thin route handler — delegates to the API service layer (src/api). No data or
 * business logic here (layering rule). Serves the full adjusted EOD series; the
 * client windows/scrubs it. The chart plots adjClose only (G6 / TS1).
 */

import { NextResponse } from 'next/server';
import { getAdjustedSeries } from '@/api';

export async function GET(
  _request: Request,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const series = await getAdjustedSeries(ticker);

  if (!series) {
    return NextResponse.json({ error: 'Unknown ticker' }, { status: 404 });
  }

  return NextResponse.json(series);
}
