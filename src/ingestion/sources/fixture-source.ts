/**
 * Fixture market-data source — placeholder NGX data (spec §8). Stands in for the
 * licensed delayed/EOD feed until it is wired (G3). Lets the full ingestion
 * pipeline (validate → write → DB) run end to end with deterministic data.
 */

import type { Company, CorporateAction, Fundamentals, RawPricePoint, Ticker } from '@/data/types';
import {
  SAMPLE_COMPANIES,
  SAMPLE_CORPORATE_ACTIONS,
  SAMPLE_FUNDAMENTALS,
  SAMPLE_RAW_PRICES,
} from '@/data/fixtures/sample-stocks';
import type { MarketDataSource } from './types';

export class FixtureMarketDataSource implements MarketDataSource {
  async listCompanies(): Promise<Company[]> {
    return SAMPLE_COMPANIES;
  }

  async fetchDailyCloses(ticker: Ticker): Promise<RawPricePoint[]> {
    return SAMPLE_RAW_PRICES[ticker] ?? [];
  }

  async fetchCorporateActions(ticker: Ticker): Promise<CorporateAction[]> {
    return SAMPLE_CORPORATE_ACTIONS[ticker] ?? [];
  }

  async fetchFundamentals(ticker: Ticker): Promise<Fundamentals[]> {
    const f = SAMPLE_FUNDAMENTALS[ticker];
    return f ? [f] : [];
  }
}
