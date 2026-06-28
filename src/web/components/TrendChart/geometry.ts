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

/** A named overlay series (e.g. a moving average) aligned to the points. */
export interface OverlayInput {
  key: string;
  values: (number | null)[];
}

export interface OverlayPath {
  key: string;
  d: string;
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
  /** SVG paths for each overlay series (gaps where the value is null). */
  overlays: OverlayPath[];
  min: number;
  max: number;
}

export interface ChartDims {
  width: number;
  height: number;
  /** Inner padding so the stroke/dot isn't clipped at edges. */
  padding?: number;
}

/**
 * Map adjClose (and any overlay series) to SVG coordinates over a shared
 * y-domain, so overlay lines align with the price line and aren't clipped.
 */
export function buildGeometry(
  points: PricePoint[],
  dims: ChartDims,
  overlays: OverlayInput[] = [],
): ChartGeometry {
  const pad = dims.padding ?? 8;
  const w = dims.width;
  const h = dims.height;
  const innerW = Math.max(1, w - pad * 2);
  const innerH = Math.max(1, h - pad * 2);

  if (points.length === 0) {
    return { line: '', area: '', coords: [], baselineY: h / 2, overlays: [], min: 0, max: 0 };
  }

  // Domain spans the close line and every non-null overlay value.
  const domainValues = points.map((p) => p.adjClose);
  for (const o of overlays) {
    for (const v of o.values) if (v != null) domainValues.push(v);
  }
  const min = Math.min(...domainValues);
  const max = Math.max(...domainValues);
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

  const overlayPaths: OverlayPath[] = overlays.map((o) => {
    let d = '';
    let move = true;
    o.values.forEach((v, i) => {
      if (v == null) {
        move = true;
        return;
      }
      const cmd = move ? 'M' : 'L';
      d += `${d ? ' ' : ''}${cmd}${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`;
      move = false;
    });
    return { key: o.key, d };
  });

  return { line, area, coords, baselineY, overlays: overlayPaths, min, max };
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
