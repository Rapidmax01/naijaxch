import { describe, expect, it } from 'vitest';
import type { PricePoint } from '@/series/types';
import { buildGeometry, buildVolumeBars, nearestIndex } from './geometry';

function pts(values: number[]): PricePoint[] {
  return values.map((v, i) => ({
    ticker: 'DEMO',
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    close: v,
    adjClose: v,
    adjOpen: v,
    adjHigh: v,
    adjLow: v,
    volume: 1000,
    adjFactor: 1,
  }));
}

describe('buildGeometry', () => {
  const dims = { width: 100, height: 100, padding: 0 };

  it('maps min to the bottom and max to the top', () => {
    const g = buildGeometry(pts([10, 20]), dims);
    expect(g.min).toBe(10);
    expect(g.max).toBe(20);
    expect(g.coords[0]!.y).toBeCloseTo(100, 6); // min → bottom
    expect(g.coords[1]!.y).toBeCloseTo(0, 6); // max → top
  });

  it('spreads x evenly across the inner width', () => {
    const g = buildGeometry(pts([1, 2, 3]), dims);
    expect(g.coords.map((c) => c.x)).toEqual([0, 50, 100]);
  });

  it('produces a closed area path', () => {
    const g = buildGeometry(pts([1, 2]), dims);
    expect(g.area.endsWith('Z')).toBe(true);
    expect(g.line.startsWith('M')).toBe(true);
  });

  it('handles a flat series without dividing by zero', () => {
    const g = buildGeometry(pts([5, 5, 5]), dims);
    expect(g.coords.every((c) => Number.isFinite(c.y))).toBe(true);
  });

  it('handles empty input', () => {
    const g = buildGeometry([], dims);
    expect(g.coords).toHaveLength(0);
    expect(g.line).toBe('');
  });
});

describe('buildGeometry overlays', () => {
  const dims = { width: 100, height: 100, padding: 0 };

  it('builds an overlay path that skips leading nulls', () => {
    const g = buildGeometry(pts([10, 20, 30]), dims, [{ key: 'ma', values: [null, 15, 25] }]);
    expect(g.overlays).toHaveLength(1);
    // Path starts at the first non-null point (index 1), so begins with M.
    expect(g.overlays[0]!.d.startsWith('M')).toBe(true);
    expect(g.overlays[0]!.d).not.toContain('NaN');
  });

  it('expands the y-domain to include overlay values', () => {
    // Close range is 10..20, but the overlay reaches 40 → max must be 40.
    const g = buildGeometry(pts([10, 20]), dims, [{ key: 'ma', values: [40, 40] }]);
    expect(g.max).toBe(40);
  });

  it('no overlays by default', () => {
    expect(buildGeometry(pts([1, 2]), dims).overlays).toEqual([]);
  });
});

describe('buildGeometry bands', () => {
  const dims = { width: 100, height: 100, padding: 0 };

  it('builds a closed fill over the defined run and expands the domain', () => {
    const g = buildGeometry(pts([10, 12, 14]), dims, [], false, [
      { key: 'bb', upper: [null, 18, 20], lower: [null, 8, 9] },
    ]);
    expect(g.bands).toHaveLength(1);
    expect(g.bands[0]!.fill.startsWith('M')).toBe(true);
    expect(g.bands[0]!.fill.endsWith('Z')).toBe(true);
    expect(g.max).toBe(20); // band upper lifts the domain
    expect(g.min).toBe(8); // band lower lowers it
  });

  it('empty fill when no index has both edges', () => {
    const g = buildGeometry(pts([10, 12]), dims, [], false, [
      { key: 'bb', upper: [null, null], lower: [null, null] },
    ]);
    expect(g.bands[0]!.fill).toBe('');
  });

  it('no bands by default', () => {
    expect(buildGeometry(pts([1, 2]), dims).bands).toEqual([]);
  });
});

describe('buildGeometry candles', () => {
  const dims = { width: 100, height: 100, padding: 0 };
  function ohlc(rows: [number, number, number, number][]): PricePoint[] {
    return rows.map(([o, h, l, c], i) => ({
      ticker: 'D',
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      close: c,
      adjClose: c,
      adjOpen: o,
      adjHigh: h,
      adjLow: l,
      volume: 1,
      adjFactor: 1,
    }));
  }

  it('returns one candle per point with correct up/down', () => {
    const g = buildGeometry(ohlc([[10, 12, 9, 11], [11, 12, 8, 9]]), dims, [], true);
    expect(g.candles).toHaveLength(2);
    expect(g.candles[0]!.up).toBe(true); // close 11 >= open 10
    expect(g.candles[1]!.up).toBe(false); // close 9 < open 11
  });

  it('expands the domain to highs and lows', () => {
    const g = buildGeometry(ohlc([[10, 20, 5, 12]]), dims, [], true);
    expect(g.max).toBe(20);
    expect(g.min).toBe(5);
  });

  it('maps high above low (smaller y is higher)', () => {
    const g = buildGeometry(ohlc([[10, 20, 5, 12]]), dims, [], true);
    expect(g.candles[0]!.highY).toBeLessThan(g.candles[0]!.lowY);
  });

  it('no candles unless requested', () => {
    expect(buildGeometry(ohlc([[10, 12, 9, 11]]), dims).candles).toEqual([]);
  });
});

describe('buildVolumeBars', () => {
  const dims = { width: 100, height: 50, padding: 0 };
  function volPts(vols: number[]): PricePoint[] {
    return vols.map((v, i) => ({
      ticker: 'D',
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      close: 10,
      adjClose: 10,
      adjOpen: i % 2 === 0 ? 9 : 11, // alternate up/down
      adjHigh: 12,
      adjLow: 8,
      volume: v,
      adjFactor: 1,
    }));
  }

  it('scales the tallest bar to the panel and shorter ones proportionally', () => {
    const bars = buildVolumeBars(volPts([50, 100]), dims);
    expect(bars).toHaveLength(2);
    expect(bars[1]!.bottomY - bars[1]!.topY).toBeCloseTo(50, 5); // max → full height
    expect(bars[0]!.bottomY - bars[0]!.topY).toBeCloseTo(25, 5); // half
  });

  it('colours bars by the day direction', () => {
    const bars = buildVolumeBars(volPts([10, 10]), dims);
    expect(bars[0]!.up).toBe(true); // open 9 < close 10
    expect(bars[1]!.up).toBe(false); // open 11 > close 10
  });

  it('returns nothing for an empty series', () => {
    expect(buildVolumeBars([], dims)).toEqual([]);
  });
});

describe('nearestIndex', () => {
  const coords = [
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 100, y: 0 },
  ];

  it('snaps to the closest point', () => {
    expect(nearestIndex(coords, 0)).toBe(0);
    expect(nearestIndex(coords, 40)).toBe(1);
    expect(nearestIndex(coords, 90)).toBe(2);
  });

  it('returns -1 for empty coords', () => {
    expect(nearestIndex([], 10)).toBe(-1);
  });
});
