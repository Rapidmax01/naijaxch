/**
 * Delayed-quote builder + tier config (Proposal 0005).
 *
 * Pure money math (decimal.js — G1/TS4), rounded for display (TS3). The delay
 * tier comes from env and is NEVER real-time (G3): end-of-day unless a licensed
 * `delayed` NGX tier is configured. The trend chart never consumes this (TS2).
 */

import Decimal from 'decimal.js';
import type { DelayedQuote, Ticker } from './types';

/**
 * Quote delay in minutes from env. `null` (end-of-day) unless `NGX_DATA_TIER`
 * is `delayed` — the only non-EOD tier Phase 1 permits (G3). Real-time stays
 * scope-locked; this helper can never return a real-time (0-minute) tier.
 */
export function configuredDelayMinutes(): number | null {
  if ((process.env.NGX_DATA_TIER ?? '').toLowerCase() !== 'delayed') return null;
  const n = Number(process.env.NGX_DATA_DELAY_MINUTES ?? 15);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 15;
}

export interface QuoteInput {
  ticker: Ticker;
  /** Last delayed/EOD price (₦). */
  price: number;
  /** Previous close, to compute the change (₦). */
  previousClose: number;
  /** ISO date (EOD) or datetime (delayed) the quote is "as of". */
  asOf: string;
  delayMinutes: number | null;
}

/**
 * Build a display quote with the change vs the previous close. Deterministic
 * (decimal.js), rounded to 2dp for ₦ and %. A zero previous close yields a 0%
 * change rather than dividing by zero.
 */
export function buildDelayedQuote(input: QuoteInput): DelayedQuote {
  const price = new Decimal(input.price);
  const prev = new Decimal(input.previousClose);
  const change = price.minus(prev);
  const changePct = prev.isZero() ? new Decimal(0) : change.div(prev).times(100);
  return {
    ticker: input.ticker,
    price: price.toDecimalPlaces(2).toNumber(),
    change: change.toDecimalPlaces(2).toNumber(),
    changePct: changePct.toDecimalPlaces(2).toNumber(),
    asOf: input.asOf,
    delayMinutes: input.delayMinutes,
  };
}
