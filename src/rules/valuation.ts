/**
 * Trend-valuation: the current P/E vs a multi-year average of historical P/Es
 * (proposal 0006 Phase B). Pure, deterministic (decimal.js — G1), rounded for
 * display (TS3). General information (G2): "trades below its N-year average P/E"
 * is an explicit spec-allowed framing — descriptive, never advice.
 *
 * Each historical P/E pairs a period's EPS with the adjusted price at that
 * period's end (paired upstream); only positive-earnings periods count.
 */

import Decimal from 'decimal.js';

export interface PePoint {
  period: string;
  pe: number;
}

export interface PeHistory {
  /** Historical P/E per period with positive earnings and a price. */
  points: PePoint[];
  /** Mean of the historical P/Es. */
  average: number;
  /** Current P/E (latest price ÷ latest EPS). */
  current: number;
  /** Current vs the average (%, signed). */
  pctVsAverage: number;
  /** Number of historical years in the average. */
  years: number;
  /** General-information sentence describing the position (G2). */
  note: string;
}

/** One period's inputs: EPS for the period and the adjusted price at its end. */
export interface PeInput {
  period: string;
  eps: number | null;
  price: number | null;
}

function round2(d: Decimal): number {
  return d.toDecimalPlaces(2).toNumber();
}

function buildNote(years: number, current: number, average: number, pct: number): string {
  const mag = Math.abs(pct).toFixed(0);
  const tail = `(${current}x vs a ${years}-year average of ${average}x).`;
  if (pct <= -5) return `Trades about ${mag}% below its ${years}-year average P/E ${tail}`;
  if (pct >= 5) return `Trades about ${mag}% above its ${years}-year average P/E ${tail}`;
  return `In line with its ${years}-year average P/E ${tail}`;
}

/**
 * Build the P/E-history context. Returns null unless there are at least two
 * historical P/E points and a positive current P/E (otherwise the comparison
 * isn't meaningful).
 */
export function peHistory(periods: PeInput[], currentPe: number | null): PeHistory | null {
  const points: PePoint[] = [];
  for (const p of periods) {
    if (p.eps != null && p.eps > 0 && p.price != null && p.price > 0) {
      points.push({ period: p.period, pe: round2(new Decimal(p.price).div(p.eps)) });
    }
  }
  if (points.length < 2 || currentPe == null || currentPe <= 0) return null;

  const sum = points.reduce((acc, p) => acc.plus(p.pe), new Decimal(0));
  const average = round2(sum.div(points.length));
  if (average === 0) return null;

  const pctVsAverage = round2(new Decimal(currentPe).minus(average).div(average).times(100));
  return {
    points,
    average,
    current: currentPe,
    pctVsAverage,
    years: points.length,
    note: buildNote(points.length, currentPe, average, pctVsAverage),
  };
}
