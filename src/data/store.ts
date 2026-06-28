/**
 * src/data — single source of truth (interface + dev implementation).
 *
 * This is the ONLY place UI/AI/series read facts from. Phase-1 scaffold ships
 * an in-memory, fixture-backed implementation. The production implementation
 * (Postgres + TimescaleDB) is intentionally deferred — it requires DB schema /
 * migration sign-off (CLAUDE.md "Human approval required").
 */

import type {
  CorporateAction,
  RawPricePoint,
  Ticker,
} from './types';
import {
  SAMPLE_COMPANIES,
  SAMPLE_CORPORATE_ACTIONS,
  SAMPLE_RAW_PRICES,
  type SampleCompany,
} from './fixtures/sample-stocks';

export interface SourceOfTruth {
  listCompanies(): Promise<SampleCompany[]>;
  getCompany(ticker: Ticker): Promise<SampleCompany | null>;
  getRawPrices(ticker: Ticker): Promise<RawPricePoint[]>;
  getCorporateActions(ticker: Ticker): Promise<CorporateAction[]>;
}

class InMemorySourceOfTruth implements SourceOfTruth {
  async listCompanies(): Promise<SampleCompany[]> {
    return SAMPLE_COMPANIES;
  }

  async getCompany(ticker: Ticker): Promise<SampleCompany | null> {
    return SAMPLE_COMPANIES.find((c) => c.ticker === ticker) ?? null;
  }

  async getRawPrices(ticker: Ticker): Promise<RawPricePoint[]> {
    return SAMPLE_RAW_PRICES[ticker] ?? [];
  }

  async getCorporateActions(ticker: Ticker): Promise<CorporateAction[]> {
    return SAMPLE_CORPORATE_ACTIONS[ticker] ?? [];
  }
}

/** Process-wide source of truth. Swap for the DB-backed impl once migrations land. */
export const dataStore: SourceOfTruth = new InMemorySourceOfTruth();
