import { describe, expect, it } from 'vitest';
import type { PricePoint } from '@/series/types';
import { buildGeometry, nearestIndex } from './geometry';

function pts(values: number[]): PricePoint[] {
  return values.map((v, i) => ({
    ticker: 'DEMO',
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    close: v,
    adjClose: v,
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
