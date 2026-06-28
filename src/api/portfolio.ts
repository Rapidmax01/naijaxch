/**
 * Portfolio series service. Builds each holding's adjusted series from the
 * source of truth, then asks the trend engine to aggregate them into a single
 * portfolio time-series (spec §5.5). Business logic lives here, not in the
 * route handler (layering rule).
 */

import { getAdjustedSeries } from './series';
import { buildPortfolioSeries, type Holding } from '@/series';
import type { PriceSeries } from '@/series/types';

/** Build the aggregated portfolio adjusted series for a set of holdings. */
export async function getPortfolioSeries(holdings: Holding[]): Promise<PriceSeries> {
  const valid = holdings.filter((h) => h.ticker && h.quantity > 0);

  const seriesByTicker = new Map<string, PriceSeries>();
  await Promise.all(
    [...new Set(valid.map((h) => h.ticker))].map(async (ticker) => {
      const series = await getAdjustedSeries(ticker);
      if (series) seriesByTicker.set(ticker, series);
    }),
  );

  return buildPortfolioSeries(valid, seriesByTicker);
}
