/**
 * Pure market-pulse + heatmap-color logic. No React, no data access — testable.
 * Operates only on already-computed change figures (G1); colour intensity is
 * purely presentational.
 */

import Decimal from 'decimal.js';
import type { ScreenerRow } from '../screener/types';

export interface MarketPulse {
  advancers: number;
  decliners: number;
  unchanged: number;
  /** Count of names with a usable 1Y change. */
  total: number;
  /** Mean 1Y change across names with data (%), rounded 2 dp; null if none. */
  avgChange: number | null;
}

/** Advancers/decliners/average over names that have a 1Y change. */
export function computePulse(rows: ScreenerRow[]): MarketPulse {
  const withData = rows.filter(
    (r): r is ScreenerRow & { changePct1Y: number } => r.changePct1Y != null,
  );

  let advancers = 0;
  let decliners = 0;
  let unchanged = 0;
  let sum = new Decimal(0);

  for (const r of withData) {
    sum = sum.plus(r.changePct1Y);
    if (r.changePct1Y > 0) advancers += 1;
    else if (r.changePct1Y < 0) decliners += 1;
    else unchanged += 1;
  }

  const avgChange = withData.length
    ? sum.div(withData.length).toDecimalPlaces(2).toNumber()
    : null;

  return { advancers, decliners, unchanged, total: withData.length, avgChange };
}

/** Magnitude (%) at which a tile reaches full colour intensity. */
const FULL_INTENSITY_AT = 10;

/**
 * Heatmap tile colour for a change %. Positive → green, negative → red, with
 * alpha scaled by magnitude; null/zero → neutral. Presentational only.
 */
export function changeColor(pct: number | null): string {
  if (pct == null) return 'rgba(100, 116, 139, 0.12)'; // neutral slate
  if (pct === 0) return 'rgba(100, 116, 139, 0.18)';
  const intensity = Math.min(Math.abs(pct), FULL_INTENSITY_AT) / FULL_INTENSITY_AT;
  const alpha = (0.18 + intensity * 0.62).toFixed(3);
  return pct > 0 ? `rgba(22, 163, 74, ${alpha})` : `rgba(220, 38, 38, ${alpha})`;
}
