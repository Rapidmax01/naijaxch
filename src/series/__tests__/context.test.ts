import { describe, expect, it } from 'vitest';
import type { PriceSeries } from '../types';
import { priceContext, priceOnOrBefore } from '../context';

function series(closes: number[]): PriceSeries {
  return {
    ticker: 'DEMO',
    points: closes.map((c, i) => ({
      ticker: 'DEMO',
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      close: c,
      adjClose: c,
      adjOpen: c,
      adjHigh: c,
      adjLow: c,
      volume: 1000,
      adjFactor: 1,
    })),
  };
}

describe('priceContext', () => {
  it('locates the latest close within the window range and vs the average', () => {
    const ctx = priceContext(series([10, 20, 15]))!;
    expect(ctx.high).toBe(20);
    expect(ctx.low).toBe(10);
    expect(ctx.average).toBe(15);
    expect(ctx.latest).toBe(15);
    expect(ctx.pctBelowHigh).toBe(25); // (20-15)/20*100
    expect(ctx.pctAboveLow).toBe(50); // (15-10)/10*100
    expect(ctx.vsAveragePct).toBe(0); // 15 vs avg 15
  });

  it('is at the high when the latest is the window max', () => {
    const ctx = priceContext(series([10, 12, 20]))!;
    expect(ctx.pctBelowHigh).toBe(0);
    expect(ctx.vsAveragePct).toBeGreaterThan(0);
  });

  it('signs vsAveragePct negative when below the average', () => {
    const ctx = priceContext(series([10, 20, 12]))!;
    expect(ctx.vsAveragePct).toBeLessThan(0);
  });

  it('returns null for an empty series', () => {
    expect(priceContext(series([]))).toBeNull();
  });
});

describe('priceOnOrBefore', () => {
  // series() dates the points 2024-01-01, -02, -03…
  const s = series([10, 20, 30]);

  it('returns the latest close on or before the date', () => {
    expect(priceOnOrBefore(s, '2024-01-02')).toBe(20);
    expect(priceOnOrBefore(s, '2024-01-03')).toBe(30);
  });

  it('returns the last point when the date is after the series', () => {
    expect(priceOnOrBefore(s, '2024-12-31')).toBe(30);
  });

  it('is null when the series starts after the date', () => {
    expect(priceOnOrBefore(s, '2023-12-31')).toBeNull();
  });
});
