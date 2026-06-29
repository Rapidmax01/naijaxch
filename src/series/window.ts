/**
 * Windowing + window statistics for the trend chart (spec §5.4, TS).
 *
 * Timeframes are counts of trading days (NGX trades ~252 days/year). Stats are
 * computed in decimal.js and rounded for display (₦ 2 dp, % 2 dp — TS3).
 */

import Decimal from 'decimal.js';
import type { PriceSeries } from './types';

export type Timeframe = '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

export const TIMEFRAMES: readonly Timeframe[] = ['1M', '3M', '6M', '1Y', '5Y', 'MAX'] as const;

export const DEFAULT_TIMEFRAME: Timeframe = '1Y';

/** Approximate trading-day counts per window; `null` = entire series. */
const TIMEFRAME_DAYS: Record<Timeframe, number | null> = {
  '1M': 22,
  '3M': 66,
  '6M': 132,
  '1Y': 252,
  '5Y': 1260,
  MAX: null,
};

/** Slice the trailing window for a timeframe. Returns the whole series for MAX. */
export function windowSeries(series: PriceSeries, timeframe: Timeframe): PriceSeries {
  const n = TIMEFRAME_DAYS[timeframe];
  if (n == null || series.points.length <= n) return series;
  return { ticker: series.ticker, points: series.points.slice(-n) };
}

export interface WindowStats {
  /** Latest adjusted close in the window. */
  latest: number;
  /** First adjusted close in the window (the reference price). */
  first: number;
  /** Net change over the window in Naira, rounded 2 dp. */
  changeAbs: number;
  /** Net change over the window in %, rounded 2 dp. */
  changePct: number;
  /** Green when net change ≥ 0, else red. */
  isUp: boolean;
  /** Lowest window adjClose volume hint sum is available via `lowVolume`. */
  lowVolume: boolean;
  /** Mean daily volume over the window (rounded to a whole number of shares). */
  avgVolume: number;
}

/** Heuristic threshold (sum of window volume) below which we hint "thinly traded". */
const THIN_VOLUME_THRESHOLD = 1000;

/**
 * Stats vs the window's first point. Pass `atIndex` to compute against an
 * arbitrary point in the window (used by scrub — change recomputed vs window
 * start, per spec).
 */
export function windowStats(series: PriceSeries, atIndex?: number): WindowStats | null {
  const pts = series.points;
  if (pts.length === 0) return null;

  const idx = atIndex == null ? pts.length - 1 : Math.max(0, Math.min(atIndex, pts.length - 1));
  const first = new Decimal(pts[0]!.adjClose);
  const current = new Decimal(pts[idx]!.adjClose);

  const changeAbs = current.minus(first);
  const changePct = first.isZero() ? new Decimal(0) : changeAbs.div(first).times(100);
  const totalVolume = pts.reduce((acc, p) => acc + p.volume, 0);

  return {
    latest: current.toDecimalPlaces(2).toNumber(),
    first: first.toDecimalPlaces(2).toNumber(),
    changeAbs: changeAbs.toDecimalPlaces(2).toNumber(),
    changePct: changePct.toDecimalPlaces(2).toNumber(),
    isUp: changeAbs.greaterThanOrEqualTo(0),
    lowVolume: totalVolume < THIN_VOLUME_THRESHOLD,
    avgVolume: Math.round(totalVolume / pts.length),
  };
}
