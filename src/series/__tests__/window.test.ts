import { describe, expect, it } from 'vitest';
import type { PriceSeries } from '../types';
import { windowSeries, windowStats } from '../window';

function makeSeries(closes: number[], volume = 1000): PriceSeries {
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
      volume,
      adjFactor: 1,
    })),
  };
}

describe('windowSeries', () => {
  const series = makeSeries(Array.from({ length: 300 }, (_, i) => i + 1));

  it('1M keeps the last 22 points', () => {
    const w = windowSeries(series, '1M');
    expect(w.points).toHaveLength(22);
    expect(w.points.at(-1)!.adjClose).toBe(300);
  });

  it('MAX returns the entire series', () => {
    expect(windowSeries(series, 'MAX').points).toHaveLength(300);
  });

  it('returns the whole series when shorter than the window', () => {
    const short = makeSeries([1, 2, 3]);
    expect(windowSeries(short, '1Y').points).toHaveLength(3);
  });
});

describe('windowStats', () => {
  it('computes change vs the window start', () => {
    const stats = windowStats(makeSeries([100, 105, 110]))!;
    expect(stats.first).toBe(100);
    expect(stats.latest).toBe(110);
    expect(stats.changeAbs).toBe(10);
    expect(stats.changePct).toBe(10);
    expect(stats.isUp).toBe(true);
  });

  it('marks downward windows', () => {
    const stats = windowStats(makeSeries([110, 90]))!;
    expect(stats.changeAbs).toBe(-20);
    expect(stats.changePct).toBeCloseTo(-18.18, 2);
    expect(stats.isUp).toBe(false);
  });

  it('recomputes against an arbitrary point for scrub', () => {
    const stats = windowStats(makeSeries([100, 200, 50]), 1)!; // scrub to index 1
    expect(stats.latest).toBe(200);
    expect(stats.changeAbs).toBe(100);
  });

  it('rounds to 2 dp (no float artifacts)', () => {
    const stats = windowStats(makeSeries([3, 3.333]))!;
    expect(stats.changeAbs).toBe(0.33);
  });

  it('flags thinly traded windows', () => {
    expect(windowStats(makeSeries([1, 2], 10))!.lowVolume).toBe(true);
    expect(windowStats(makeSeries([1, 2], 5000))!.lowVolume).toBe(false);
  });

  it('returns null for an empty series', () => {
    expect(windowStats({ ticker: 'X', points: [] })).toBeNull();
  });
});
