/**
 * Growth service: reads a company's fundamentals history from the source of
 * truth and asks the rules engine to compute YoY growth + ROE (G1). General
 * information (G2). Does NOT feed AI summaries (gate #4 unchanged).
 */

import { dataStore } from '@/data';
import { computeGrowth, type GrowthReport } from '@/rules';
import type { Ticker } from '@/data/types';

export async function getGrowthReport(ticker: Ticker): Promise<GrowthReport | null> {
  const history = await dataStore.getFundamentalsHistory(ticker);
  return computeGrowth(history);
}
