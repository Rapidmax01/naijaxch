/**
 * Delayed-quote read for the company-page badge (Proposal 0005).
 *
 * Reads a computed DelayedQuote from the source of truth (layering rule — the
 * UI/route never touches a raw feed; G3). Display-only; never feeds the chart
 * (TS2) or the AI grounding inputs (#4).
 */

import { dataStore, type DelayedQuote, type Ticker } from '@/data';

export async function getDelayedQuote(ticker: Ticker): Promise<DelayedQuote | null> {
  return dataStore.getQuote(ticker);
}
