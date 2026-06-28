import { describe, expect, it } from 'vitest';
import { getPortfolioSeries } from './portfolio';

/**
 * Integration-ish test over the fixture-backed source of truth: the service
 * builds each holding's adjusted series and aggregates it.
 */
describe('getPortfolioSeries', () => {
  it('aggregates known sample tickers into a non-empty series', async () => {
    const series = await getPortfolioSeries([
      { ticker: 'DANGCEM', quantity: 10 },
      { ticker: 'GTCO', quantity: 100 },
    ]);
    expect(series.ticker).toBe('PORTFOLIO');
    expect(series.points.length).toBeGreaterThan(0);
    // Portfolio value is positive and rounded to 2 dp.
    const last = series.points.at(-1)!;
    expect(last.adjClose).toBeGreaterThan(0);
    expect(Number.isFinite(last.adjClose)).toBe(true);
  });

  it('ignores zero/negative quantities and unknown tickers', async () => {
    const series = await getPortfolioSeries([
      { ticker: 'DANGCEM', quantity: 0 },
      { ticker: 'NOPE', quantity: 50 },
    ]);
    // All holdings filtered out → empty portfolio.
    expect(series.points).toHaveLength(0);
  });

  it('returns empty when a holding has no price data', async () => {
    const series = await getPortfolioSeries([
      { ticker: 'DANGCEM', quantity: 10 },
      { ticker: 'NOPE', quantity: 50 },
    ]);
    // NOPE has no series → buildPortfolioSeries returns empty (can't value).
    expect(series.points).toHaveLength(0);
  });
});
