/**
 * Pure SVG geometry for the trend chart — no React, fully unit-testable.
 * Pixel coordinates are presentational, so plain float math is fine here
 * (money math stays in src/series with decimal.js).
 */

import type { PricePoint } from '@/series/types';

export interface Pt {
  x: number;
  y: number;
}

export interface ChartGeometry {
  /** SVG path `d` for the line. */
  line: string;
  /** SVG path `d` for the area fill (line closed to the bottom). */
  area: string;
  /** Per-point pixel coordinates (parallel to the input points). */
  coords: Pt[];
  /** Pixel y for the reference line (window's first adjClose). */
  baselineY: number;
  min: number;
  max: number;
}

export interface ChartDims {
  width: number;
  height: number;
  /** Inner padding so the stroke/dot isn't clipped at edges. */
  padding?: number;
}

/** Map adjClose values to SVG coordinates over [padding, dim-padding]. */
export function buildGeometry(points: PricePoint[], dims: ChartDims): ChartGeometry {
  const pad = dims.padding ?? 8;
  const w = dims.width;
  const h = dims.height;
  const innerW = Math.max(1, w - pad * 2);
  const innerH = Math.max(1, h - pad * 2);

  if (points.length === 0) {
    return { line: '', area: '', coords: [], baselineY: h / 2, min: 0, max: 0 };
  }

  const values = points.map((p) => p.adjClose);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1; // avoid /0 on a flat series

  const xAt = (i: number) =>
    points.length === 1 ? pad + innerW / 2 : pad + (i / (points.length - 1)) * innerW;
  const yAt = (v: number) => pad + innerH - ((v - min) / span) * innerH;

  const coords: Pt[] = points.map((p, i) => ({ x: xAt(i), y: yAt(p.adjClose) }));

  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(' ');

  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const area = `${line} L${last.x.toFixed(2)},${(h - pad).toFixed(2)} L${first.x.toFixed(
    2,
  )},${(h - pad).toFixed(2)} Z`;

  const baselineY = yAt(points[0]!.adjClose);

  return { line, area, coords, baselineY, min, max };
}

/** Index of the coordinate nearest a pointer x (for scrub snapping). */
export function nearestIndex(coords: Pt[], x: number): number {
  if (coords.length === 0) return -1;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = Math.abs(coords[i]!.x - x);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
