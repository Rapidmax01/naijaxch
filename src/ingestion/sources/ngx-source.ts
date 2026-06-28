/**
 * NGX market-data source (NOT IMPLEMENTED — gated).
 *
 * GUARDRAIL G3: displaying NGX data requires an NGX distribution licence;
 * Phase 1 uses the DELAYED / END-OF-DAY tier only. NEVER wire a real-time/tick
 * feed (separate paid licence). Adding this integration needs human approval
 * (CLAUDE.md #6). This class marks the seam; the fixture source is used until
 * the licence + endpoint details are confirmed.
 */

import type { Company, CorporateAction, Fundamentals, RawPricePoint, Ticker } from '@/data/types';
import type { MarketDataSource } from './types';

const NOT_WIRED =
  'NGX market-data source not implemented: requires a licensed delayed/EOD feed and human approval (G3).';

export class NgxMarketDataSource implements MarketDataSource {
  async listCompanies(): Promise<Company[]> {
    throw new Error(NOT_WIRED);
  }
  async fetchDailyCloses(_ticker: Ticker): Promise<RawPricePoint[]> {
    throw new Error(NOT_WIRED);
  }
  async fetchCorporateActions(_ticker: Ticker): Promise<CorporateAction[]> {
    throw new Error(NOT_WIRED);
  }
  async fetchFundamentals(_ticker: Ticker): Promise<Fundamentals[]> {
    throw new Error(NOT_WIRED);
  }
}
