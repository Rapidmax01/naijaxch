/**
 * Price context over a window — where the latest adjusted close sits relative
 * to its own recent range and average. Pure, deterministic (decimal.js — G1),
 * rounded for display (TS3). General information only (G2): it describes where
 * the price has been, never whether to act.
 *
 * Uses the adjusted series (adjClose — TS1/G6); the window is EOD daily.
 */

import Decimal from 'decimal.js';
import type { PriceSeries } from './types';
import { windowSeries, type Timeframe } from './window';

export interface PriceContext {
  timeframe: Timeframe;
  /** Latest adjusted close in the window (₦). */
  latest: number;
  /** Window high / low / mean adjusted close (₦). */
  high: number;
  low: number;
  average: number;
  /** How far below the window high the latest sits (%, ≥ 0). */
  pctBelowHigh: number;
  /** How far above the window low the latest sits (%, ≥ 0). */
  pctAboveLow: number;
  /** Latest vs the window average (%, signed). */
  vsAveragePct: number;
}

/**
 * Adjusted close as of `isoDate` — the latest point on or before that date, or
 * null if the series starts after it. Points are ascending by date. Used to pair
 * a fiscal period-end with a price (proposal 0006 Phase B). adjClose only (G6).
 */
export function priceOnOrBefore(series: PriceSeries, isoDate: string): number | null {
  let found: number | null = null;
  for (const p of series.points) {
    if (p.date <= isoDate) found = p.adjClose;
    else break;
  }
  return found;
}

export function priceContext(series: PriceSeries, timeframe: Timeframe = '1Y'): PriceContext | null {
  const pts = windowSeries(series, timeframe).points;
  if (pts.length === 0) return null;

  const closes = pts.map((p) => new Decimal(p.adjClose));
  const latest = closes[closes.length - 1]!;
  let high = closes[0]!;
  let low = closes[0]!;
  let sum = new Decimal(0);
  for (const c of closes) {
    if (c.gt(high)) high = c;
    if (c.lt(low)) low = c;
    sum = sum.plus(c);
  }
  const average = sum.div(closes.length);

  const pctBelowHigh = high.isZero() ? new Decimal(0) : high.minus(latest).div(high).times(100);
  const pctAboveLow = low.isZero() ? new Decimal(0) : latest.minus(low).div(low).times(100);
  const vsAveragePct = average.isZero()
    ? new Decimal(0)
    : latest.minus(average).div(average).times(100);

  const r = (d: Decimal) => d.toDecimalPlaces(2).toNumber();
  return {
    timeframe,
    latest: r(latest),
    high: r(high),
    low: r(low),
    average: r(average),
    pctBelowHigh: r(pctBelowHigh),
    pctAboveLow: r(pctAboveLow),
    vsAveragePct: r(vsAveragePct),
  };
}
