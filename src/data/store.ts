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
  DelayedQuote,
  Fundamentals,
  RawPricePoint,
  Ticker,
} from './types';
import { buildDelayedQuote, configuredDelayMinutes } from './quote';
import {
  SAMPLE_COMPANIES,
  SAMPLE_CORPORATE_ACTIONS,
  SAMPLE_FUNDAMENTALS,
  SAMPLE_RAW_PRICES,
  type SampleCompany,
} from './fixtures/sample-stocks';
import { PrismaSourceOfTruth } from './prisma-store';

export interface SourceOfTruth {
  listCompanies(): Promise<SampleCompany[]>;
  getCompany(ticker: Ticker): Promise<SampleCompany | null>;
  getRawPrices(ticker: Ticker): Promise<RawPricePoint[]>;
  getCorporateActions(ticker: Ticker): Promise<CorporateAction[]>;
  getFundamentals(ticker: Ticker): Promise<Fundamentals | null>;
  /** Latest delayed/EOD quote for the company-page badge (display-only; TS2). */
  getQuote(ticker: Ticker): Promise<DelayedQuote | null>;
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

  async getFundamentals(ticker: Ticker): Promise<Fundamentals | null> {
    return SAMPLE_FUNDAMENTALS[ticker] ?? null;
  }

  async getQuote(ticker: Ticker): Promise<DelayedQuote | null> {
    const prices = SAMPLE_RAW_PRICES[ticker] ?? [];
    if (prices.length === 0) return null;
    const last = prices[prices.length - 1]!;
    const prev = prices[prices.length - 2] ?? last;
    return buildDelayedQuote({
      ticker,
      price: last.close,
      previousClose: prev.close,
      asOf: last.date,
      delayMinutes: configuredDelayMinutes(),
    });
  }
}

/**
 * Process-wide source of truth. Uses the Postgres/TimescaleDB-backed store when
 * DATABASE_URL is set, otherwise the in-memory fixture store — so the app, tests,
 * and CI run without a database. The Prisma client is only constructed when the
 * DB path is actually selected (lazy in prisma-store).
 */
function selectStore(): SourceOfTruth {
  // PrismaSourceOfTruth constructs its client lazily (first query only), so the
  // fixture path never opens a DB connection even though the class is imported.
  return process.env.DATABASE_URL ? new PrismaSourceOfTruth() : new InMemorySourceOfTruth();
}

export const dataStore: SourceOfTruth = selectStore();
