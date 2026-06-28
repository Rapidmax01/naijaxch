/**
 * Report-card service. Reads fundamentals from the source of truth and the
 * latest adjusted close from the trend engine, then asks the rules engine to
 * compute the card. All numbers come from src/rules / src/series (G1).
 */

import { dataStore } from '@/data';
import { computeReportCard, type ReportCard } from '@/rules';
import { getAdjustedSeries } from './series';
import type { Ticker } from '@/data/types';

/** Build the report card for a ticker, or null if fundamentals/prices are missing. */
export async function getReportCard(ticker: Ticker): Promise<ReportCard | null> {
  const [fundamentals, series] = await Promise.all([
    dataStore.getFundamentals(ticker),
    getAdjustedSeries(ticker),
  ]);

  const latest = series?.points.at(-1)?.adjClose;
  if (!fundamentals || latest == null) return null;

  return computeReportCard(fundamentals, latest);
}
