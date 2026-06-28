import { describe, expect, it } from 'vitest';
import type { CorporateAction, RawPricePoint } from '@/data/types';
import {
  actionFactor,
  bonusSplitFactor,
  buildAdjustedSeries,
  rightsFactor,
  terp,
} from '../adjust';

describe('bonusSplitFactor', () => {
  it('1-for-4 bonus → 4/5 = 0.8', () => {
    expect(bonusSplitFactor({ newShares: 1, perHeld: 4 }).toNumber()).toBe(0.8);
  });

  it('1-for-1 bonus → 1/2 = 0.5', () => {
    expect(bonusSplitFactor({ newShares: 1, perHeld: 1 }).toNumber()).toBe(0.5);
  });

  it('2-for-1 split → 1/3', () => {
    expect(bonusSplitFactor({ newShares: 2, perHeld: 1 }).toNumber()).toBeCloseTo(1 / 3, 12);
  });

  it('throws on degenerate terms', () => {
    expect(() => bonusSplitFactor({ newShares: 0, perHeld: 0 })).toThrow();
  });
});

describe('rights issue (TERP)', () => {
  // Known-good worked example:
  // 1 new per 2 held, cum price ₦10.00, subscription ₦7.00.
  // TERP = (2*10 + 1*7) / (2+1) = 27/3 = 9.00
  // factor = TERP/cum = 9/10 = 0.9
  const terms = { newShares: 1, perHeld: 2, subscriptionPrice: 7, cumPrice: 10 };

  it('computes TERP correctly', () => {
    expect(terp(terms).toNumber()).toBe(9);
  });

  it('computes the rights factor as TERP/cum', () => {
    expect(rightsFactor(terms).toNumber()).toBe(0.9);
  });

  it('discounted rights pull the factor further below 1', () => {
    // 1-for-1 at ₦1 subscription vs ₦10 cum → TERP = 5.5 → factor 0.55
    const deep = { newShares: 1, perHeld: 1, subscriptionPrice: 1, cumPrice: 10 };
    expect(rightsFactor(deep).toNumber()).toBe(0.55);
  });
});

describe('actionFactor dispatch', () => {
  it('routes bonus/split/rights', () => {
    expect(actionFactor({ ticker: 'X', exDate: '2024-01-01', type: 'bonus', terms: { newShares: 1, perHeld: 4 } }).toNumber()).toBe(0.8);
    expect(actionFactor({ ticker: 'X', exDate: '2024-01-01', type: 'split', terms: { newShares: 1, perHeld: 1 } }).toNumber()).toBe(0.5);
    expect(actionFactor({ ticker: 'X', exDate: '2024-01-01', type: 'rights', terms: { newShares: 1, perHeld: 2, subscriptionPrice: 7, cumPrice: 10 } }).toNumber()).toBe(0.9);
  });
});

describe('buildAdjustedSeries (back-adjustment)', () => {
  const row = (date: string, close: number): RawPricePoint => ({
    ticker: 'DEMO',
    date,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
  });
  const raw: RawPricePoint[] = [
    row('2024-01-01', 100),
    row('2024-01-02', 100),
    // bonus ex-date 2024-01-03 (1-for-4 → factor 0.8) sits here
    row('2024-01-03', 80),
    row('2024-01-04', 80),
  ];
  const actions: CorporateAction[] = [
    { ticker: 'DEMO', exDate: '2024-01-03', type: 'bonus', terms: { newShares: 1, perHeld: 4 } },
  ];

  it('applies factor to days strictly before the ex-date only', () => {
    const series = buildAdjustedSeries(raw, actions);
    const byDate = Object.fromEntries(series.points.map((p) => [p.date, p]));

    // Pre-ex days are scaled by 0.8 → continuous with post-ex 80.
    expect(byDate['2024-01-01']!.adjClose).toBe(80);
    expect(byDate['2024-01-02']!.adjClose).toBe(80);
    // Ex-date and after are unadjusted (factor 1).
    expect(byDate['2024-01-03']!.adjClose).toBe(80);
    expect(byDate['2024-01-03']!.adjFactor).toBe(1);
    expect(byDate['2024-01-04']!.adjClose).toBe(80);
    // raw close is preserved for audit.
    expect(byDate['2024-01-01']!.close).toBe(100);
  });

  it('removes the fake ex-date cliff (adjusted series is smooth)', () => {
    const { points } = buildAdjustedSeries(raw, actions);
    const adj = points.map((p) => p.adjClose);
    expect(Math.max(...adj) - Math.min(...adj)).toBe(0); // flat once adjusted
  });

  it('sorts input and handles an empty series', () => {
    expect(buildAdjustedSeries([], actions).points).toHaveLength(0);
    const shuffled = [raw[2]!, raw[0]!, raw[3]!, raw[1]!];
    const series = buildAdjustedSeries(shuffled, actions);
    expect(series.points.map((p) => p.date)).toEqual([
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
      '2024-01-04',
    ]);
  });

  it('back-adjusts open/high/low by the same factor as close', () => {
    const ohlc: RawPricePoint[] = [
      { ticker: 'D', date: '2024-01-01', open: 90, high: 110, low: 85, close: 100, volume: 1 },
      { ticker: 'D', date: '2024-01-03', open: 72, high: 88, low: 68, close: 80, volume: 1 },
    ];
    // bonus ex 2024-01-02, 1-for-4 → factor 0.8 applies to the pre-ex day only.
    const s = buildAdjustedSeries(ohlc, [
      { ticker: 'D', exDate: '2024-01-02', type: 'bonus', terms: { newShares: 1, perHeld: 4 } },
    ]);
    const d0 = s.points[0]!;
    expect([d0.adjOpen, d0.adjHigh, d0.adjLow, d0.adjClose]).toEqual([72, 88, 68, 80]);
    const d1 = s.points[1]!; // post-ex: factor 1
    expect([d1.adjOpen, d1.adjHigh, d1.adjLow, d1.adjClose]).toEqual([72, 88, 68, 80]);
  });

  it('compounds multiple actions multiplicatively', () => {
    // Two bonuses both after day 1: 0.8 * 0.5 = 0.4
    const multi: CorporateAction[] = [
      { ticker: 'DEMO', exDate: '2024-01-03', type: 'bonus', terms: { newShares: 1, perHeld: 4 } },
      { ticker: 'DEMO', exDate: '2024-01-04', type: 'bonus', terms: { newShares: 1, perHeld: 1 } },
    ];
    const series = buildAdjustedSeries(raw, multi);
    expect(series.points[0]!.adjFactor).toBeCloseTo(0.4, 12);
    expect(series.points[0]!.adjClose).toBeCloseTo(40, 9);
  });
});
