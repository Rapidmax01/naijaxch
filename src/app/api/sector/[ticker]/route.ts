/**
 * Thin route handler — delegates to the API service layer (src/api). No data or
 * business logic here (layering rule). Serves a company's sector-relative
 * context (general information — G2). Cached briefly; the universe changes only
 * on ingestion, so a short TTL is plenty.
 */

import { NextResponse } from 'next/server';
import { getSectorContext } from '@/api';

export async function GET(
  _request: Request,
  { params }: { params: { ticker: string } },
) {
  const context = await getSectorContext(params.ticker.toUpperCase());

  if (!context) {
    return NextResponse.json({ error: 'Unknown ticker' }, { status: 404 });
  }

  return NextResponse.json(context, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
  });
}
