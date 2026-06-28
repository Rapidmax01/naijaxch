import { describe, expect, it } from 'vitest';
import type { Company, CorporateAction, Fundamentals, RawPricePoint } from '@/data/types';
import {
  SAMPLE_COMPANIES,
  SAMPLE_CORPORATE_ACTIONS,
  SAMPLE_RAW_PRICES,
} from '@/data/fixtures/sample-stocks';
import { FixtureMarketDataSource } from './sources/fixture-source';
import { runIngestion } from './jobs';
import type { MarketDataWriter } from './writer';

// Expected counts derived from the fixture, so this stays correct as it grows.
const EXPECTED_COMPANIES = SAMPLE_COMPANIES.length;
const EXPECTED_PRICES = Object.values(SAMPLE_RAW_PRICES).reduce((n, p) => n + p.length, 0);
const EXPECTED_ACTIONS = Object.values(SAMPLE_CORPORATE_ACTIONS).reduce((n, a) => n + a.length, 0);

/** In-memory writer capturing what would be persisted. */
class FakeWriter implements MarketDataWriter {
  companies: Company[] = [];
  prices: RawPricePoint[] = [];
  actions: CorporateAction[] = [];
  fundamentals: Fundamentals[] = [];

  async upsertCompanies(c: Company[]) {
    this.companies.push(...c);
    return c.length;
  }
  async upsertRawPrices(p: RawPricePoint[]) {
    this.prices.push(...p);
    return p.length;
  }
  async upsertCorporateActions(a: CorporateAction[]) {
    this.actions.push(...a);
    return a.length;
  }
  async upsertFundamentals(f: Fundamentals[]) {
    this.fundamentals.push(...f);
    return f.length;
  }
}

describe('runIngestion (fixture source → fake writer)', () => {
  it('ingests every company, price, action and fundamentals row', async () => {
    const writer = new FakeWriter();
    const summary = await runIngestion(new FixtureMarketDataSource(), writer);

    // Every fixture company, its daily series, actions, and one fundamentals/co.
    expect(summary.companies).toBe(EXPECTED_COMPANIES);
    expect(summary.rawPrices).toBe(EXPECTED_PRICES);
    expect(summary.corporateActions).toBe(EXPECTED_ACTIONS);
    expect(summary.fundamentals).toBe(EXPECTED_COMPANIES);

    // Writer actually received the data.
    expect(writer.companies).toHaveLength(EXPECTED_COMPANIES);
    expect(writer.prices).toHaveLength(EXPECTED_PRICES);
  });

  it('is idempotent in counts when run twice against a fresh writer', async () => {
    const a = await runIngestion(new FixtureMarketDataSource(), new FakeWriter());
    const b = await runIngestion(new FixtureMarketDataSource(), new FakeWriter());
    expect(a).toEqual(b);
  });
});
