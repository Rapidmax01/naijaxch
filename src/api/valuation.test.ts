import { describe, expect, it } from 'vitest';
import { buildAdjustedSeries } from '@/series';
import { SAMPLE_CORPORATE_ACTIONS, SAMPLE_FUNDAMENTALS, SAMPLE_RAW_PRICES } from '@/data/fixtures/sample-stocks';
import { peHistoryFrom } from './valuation';

// Integration over the real fixtures (5-yr price history × 5-period fundamentals,
// now overlapping). Builds the series from the fixtures directly — independent of
// the store/DB selection — so it exercises the period-end ↔ price alignment.
describe('peHistoryFrom (fixtures, end to end)', () => {
  it('builds a multi-year P/E context for a profitable name', () => {
    const series = buildAdjustedSeries(SAMPLE_RAW_PRICES.GTCO!, SAMPLE_CORPORATE_ACTIONS.GTCO ?? []);
    const r = peHistoryFrom(SAMPLE_FUNDAMENTALS.GTCO!, series);
    expect(r).not.toBeNull();
    expect(r!.points.length).toBeGreaterThanOrEqual(2);
    expect(r!.current).toBeGreaterThan(0);
    expect(r!.note).toMatch(/average P\/E/);
  });

  it('returns null for a loss-making name (no positive-earnings P/E points)', () => {
    const series = buildAdjustedSeries(SAMPLE_RAW_PRICES.MTNN!, SAMPLE_CORPORATE_ACTIONS.MTNN ?? []);
    expect(peHistoryFrom(SAMPLE_FUNDAMENTALS.MTNN!, series)).toBeNull();
  });
});
