/**
 * Market-data source interface — the seam between an upstream provider and our
 * source of truth. Implementations: the fixture source (placeholder data) and
 * a real NGX adapter (gated — licensed delayed/EOD feed; G3).
 */

import type { Company, CorporateAction, Fundamentals, RawPricePoint, Ticker } from '@/data/types';

export interface MarketDataSource {
  /** The companies this source can supply. */
  listCompanies(): Promise<Company[]>;
  /** Daily EOD closes for a ticker (delayed/EOD only — never real-time; G3). */
  fetchDailyCloses(ticker: Ticker): Promise<RawPricePoint[]>;
  /** Corporate actions (bonus/split/rights) for a ticker. */
  fetchCorporateActions(ticker: Ticker): Promise<CorporateAction[]>;
  /** Reported fundamentals (one row per period) for a ticker. */
  fetchFundamentals(ticker: Ticker): Promise<Fundamentals[]>;
}
