import { describe, expect, it } from 'vitest';
import type { Company, CorporateAction, Fundamentals, RawPricePoint } from '@/data/types';
import { FixtureMarketDataSource } from './sources/fixture-source';
import { runIngestion } from './jobs';
import type { MarketDataWriter } from './writer';

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

    // 3 sample companies, 260 trading days each, 1 bonus action, 1 fundamentals/co.
    expect(summary.companies).toBe(3);
    expect(summary.rawPrices).toBe(3 * 260);
    expect(summary.corporateActions).toBe(1);
    expect(summary.fundamentals).toBe(3);

    // Writer actually received the data.
    expect(writer.companies).toHaveLength(3);
    expect(writer.prices).toHaveLength(780);
  });

  it('is idempotent in counts when run twice against a fresh writer', async () => {
    const a = await runIngestion(new FixtureMarketDataSource(), new FakeWriter());
    const b = await runIngestion(new FixtureMarketDataSource(), new FakeWriter());
    expect(a).toEqual(b);
  });
});
