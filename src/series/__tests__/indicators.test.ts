import { describe, expect, it } from 'vitest';
import { bollinger, ema, sma } from '../indicators';

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
