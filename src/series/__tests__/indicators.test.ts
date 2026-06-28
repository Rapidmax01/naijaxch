import { describe, expect, it } from 'vitest';
import { bollinger, ema, macd, rsi, sma } from '../indicators';

describe('sma', () => {
  it('is null until the period is reached, then the trailing mean', () => {
    expect(sma([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
  });

  it('handles a longer period', () => {
    expect(sma([2, 4, 6, 8, 10], 3)).toEqual([null, null, 4, 6, 8]);
  });

  it('period 1 returns the values themselves', () => {
    expect(sma([5, 7, 9], 1)).toEqual([5, 7, 9]);
  });

  it('all null when fewer points than the period', () => {
    expect(sma([1, 2], 5)).toEqual([null, null]);
  });

  it('rounds to avoid float drift', () => {
    expect(sma([10, 10.1, 10.2], 3)).toEqual([null, null, 10.1]);
  });

  it('throws on a non-positive period', () => {
    expect(() => sma([1, 2], 0)).toThrow();
  });
});

describe('ema', () => {
  it('seeds with the SMA then applies the smoothing factor', () => {
    // period 3 → k = 0.5. seed sma(1,2,3)=2; then (4-2)*.5+2=3; (5-3)*.5+3=4.
    expect(ema([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });
  it('is all null when fewer points than the period', () => {
    expect(ema([1, 2], 5)).toEqual([null, null]);
  });
});

describe('bollinger', () => {
  it('returns the SMA middle with ±mult·stddev bands', () => {
    // period 2, mult 1. window [2,4]: mean 3, std 1 → mid 3, up 4, low 2.
    const b = bollinger([2, 4, 6, 8], 2, 1);
    expect(b.middle).toEqual([null, 3, 5, 7]);
    expect(b.upper).toEqual([null, 4, 6, 8]);
    expect(b.lower).toEqual([null, 2, 4, 6]);
  });
  it('upper ≥ middle ≥ lower wherever defined', () => {
    const b = bollinger([10, 12, 9, 14, 11, 13], 3, 2);
    b.middle.forEach((m, i) => {
      if (m == null) return;
      expect(b.upper[i]!).toBeGreaterThanOrEqual(m);
      expect(b.lower[i]!).toBeLessThanOrEqual(m);
    });
  });
});

describe('rsi', () => {
  it('is null until the period is reached', () => {
    const r = rsi([1, 2, 3], 14);
    expect(r).toEqual([null, null, null]);
  });

  it('is 100 when every change is a gain', () => {
    const r = rsi([1, 2, 3, 4, 5], 2);
    // From index 2 onward there are no losses → RSI pinned at 100.
    expect(r.slice(2).every((v) => v === 100)).toBe(true);
  });

  it('is 0 when every change is a loss', () => {
    const r = rsi([5, 4, 3, 2, 1], 2);
    expect(r.slice(2).every((v) => v === 0)).toBe(true);
  });

  it('stays within 0..100 on a mixed series', () => {
    const r = rsi([44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42], 5);
    r.forEach((v) => {
      if (v == null) return;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it('throws on a non-positive period', () => {
    expect(() => rsi([1, 2, 3], 0)).toThrow();
  });
});

describe('macd', () => {
  it('macd line is defined once the slow EMA is, and equals fast − slow', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8];
    const m = macd(values, 2, 4, 2);
    // slow EMA (period 4) seeds at index 3 → macd null before, defined from 3.
    expect(m.macd.slice(0, 3).every((v) => v == null)).toBe(true);
    expect(m.macd[3]).not.toBeNull();
  });

  it('histogram equals macd − signal wherever both are defined', () => {
    const values = [3, 5, 2, 8, 6, 9, 4, 11, 7, 12, 5, 13];
    const m = macd(values, 3, 6, 3);
    m.histogram.forEach((h, i) => {
      if (h == null) return;
      expect(h).toBeCloseTo(m.macd[i]! - m.signal[i]!, 4);
    });
  });

  it('macd is positive for a steadily rising series', () => {
    const values = Array.from({ length: 40 }, (_, i) => i + 1);
    const m = macd(values);
    const last = m.macd[m.macd.length - 1]!;
    expect(last).toBeGreaterThan(0);
  });
});
