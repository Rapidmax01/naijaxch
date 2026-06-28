/**
 * src/series — the trend engine's output contract.
 *
 * The adjusted EOD price series. `adjClose` is the only field a chart plots
 * (TS1 / G6). `close` and `adjFactor` are retained for reference and audit.
 */

import type { Ticker } from '@/data/types';

/** One day of the adjusted EOD series. */
export interface PricePoint {
  ticker: Ticker;
  /** ISO trading day, `YYYY-MM-DD`. */
  date: string;
  /** Unadjusted close (reference/audit — NEVER plotted on a multi-period chart). */
  close: number;
  /** Corporate-action-adjusted close — the value the line chart plots. */
  adjClose: number;
  /** Corporate-action-adjusted open/high/low — what the candlestick view plots (G6). */
  adjOpen: number;
  adjHigh: number;
  adjLow: number;
  /** Day volume. */
  volume: number;
  /** Cumulative adjustment factor applied to this day (audit). */
  adjFactor: number;
}

/** A full adjusted series for one equity (or a portfolio), ascending by date. */
export interface PriceSeries {
  ticker: Ticker;
  points: PricePoint[];
}
