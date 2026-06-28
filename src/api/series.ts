/**
 * src/api — backend service layer. Route handlers (src/app/api) call into here;
 * they hold no data/business logic themselves (layering rule).
 *
 * The series service reads raw facts from the source of truth (src/data) and
 * asks the trend engine (src/series) to build the adjusted series. The chart
 * receives a ready PriceSeries — it never fetches or adjusts.
 */

import { dataStore } from '@/data';
import { buildAdjustedSeries } from '@/series';
import type { PriceSeries } from '@/series/types';
import type { Ticker } from '@/data/types';

/** Build the full adjusted EOD series for a ticker, or null if unknown. */
export async function getAdjustedSeries(ticker: Ticker): Promise<PriceSeries | null> {
  const company = await dataStore.getCompany(ticker);
  if (!company) return null;

  const [raw, actions] = await Promise.all([
    dataStore.getRawPrices(ticker),
    dataStore.getCorporateActions(ticker),
  ]);

  return buildAdjustedSeries(raw, actions);
}
