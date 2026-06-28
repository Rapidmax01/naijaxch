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

/** A single candlestick in pixel space. */
export interface Candle {
  x: number;
  halfWidth: number;
  openY: number;
  closeY: number;
  highY: number;
  lowY: number;
  up: boolean;
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
  /** Candlestick geometry (only when `candles` is requested). */
  candles: Candle[];
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
  candles = false,
): ChartGeometry {
  const pad = dims.padding ?? 8;
  const w = dims.width;
  const h = dims.height;
  const innerW = Math.max(1, w - pad * 2);
  const innerH = Math.max(1, h - pad * 2);

  if (points.length === 0) {
    return {
      line: '',
      area: '',
      coords: [],
      baselineY: h / 2,
      overlays: [],
      candles: [],
      min: 0,
      max: 0,
    };
  }

  // Domain spans the plotted price (close, or high/low when showing candles)
  // plus every non-null overlay value, so nothing is clipped.
  const domainValues: number[] = [];
  for (const p of points) {
    if (candles) domainValues.push(p.adjHigh, p.adjLow);
    else domainValues.push(p.adjClose);
  }
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

  const candleGeom: Candle[] = candles
    ? points.map((p, i) => {
        const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
        return {
          x: xAt(i),
          halfWidth: Math.max(0.6, Math.min(6, (step * 0.6) / 2)),
          openY: yAt(p.adjOpen),
          closeY: yAt(p.adjClose),
          highY: yAt(p.adjHigh),
          lowY: yAt(p.adjLow),
          up: p.adjClose >= p.adjOpen,
        };
      })
    : [];

  return { line, area, coords, baselineY, overlays: overlayPaths, candles: candleGeom, min, max };
}

/** A single volume bar in pixel space (aligned to the price chart's x-scale). */
export interface VolumeBar {
  x: number;
  halfWidth: number;
  topY: number;
  bottomY: number;
  up: boolean;
}

/** Volume bars scaled to the panel height; coloured by the day's direction. */
export function buildVolumeBars(points: PricePoint[], dims: ChartDims): VolumeBar[] {
  if (points.length === 0) return [];
  const pad = dims.padding ?? 8;
  const innerW = Math.max(1, dims.width - pad * 2);
  const innerH = Math.max(1, dims.height - pad * 2);
  const maxVol = Math.max(1, ...points.map((p) => p.volume));
  const baseY = dims.height - pad;
  const xAt = (i: number) =>
    points.length === 1 ? pad + innerW / 2 : pad + (i / (points.length - 1)) * innerW;
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const halfWidth = Math.max(0.6, Math.min(6, (step * 0.6) / 2));

  return points.map((p, i) => {
    const h = (p.volume / maxVol) * innerH;
    return { x: xAt(i), halfWidth, topY: baseY - h, bottomY: baseY, up: p.adjClose >= p.adjOpen };
  });
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
