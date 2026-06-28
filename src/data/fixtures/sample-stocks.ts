/**
 * Deterministic sample NGX data for local development and the chart demo.
 *
 * NOT real NGX prices — placeholder figures so the engine and chart have
 * something to render before the licensed delayed/EOD feed is wired (G3).
 * Generated deterministically (no randomness) so tests and snapshots are stable.
 */

import type { CorporateAction, RawPricePoint, Ticker } from '../types';

export interface SampleCompany {
  ticker: Ticker;
  name: string;
  sector: string;
}

export const SAMPLE_COMPANIES: SampleCompany[] = [
  { ticker: 'DANGCEM', name: 'Dangote Cement Plc', sector: 'Industrial Goods' },
  { ticker: 'GTCO', name: 'Guaranty Trust Holding Co Plc', sector: 'Financial Services' },
  { ticker: 'MTNN', name: 'MTN Nigeria Communications Plc', sector: 'Telecoms' },
];

/** ~260 trading days ending 2024-12-31, weekdays only. */
function tradingDays(count: number): string[] {
  const days: string[] = [];
  // Walk back from a fixed end date; skip Sat/Sun. Fixed seed date for determinism.
  const end = new Date(Date.UTC(2024, 11, 31));
  const cursor = new Date(end);
  while (days.length < count) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      days.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days.reverse();
}

/** Deterministic price path: trend + sine wave, no randomness. */
function syntheticCloses(base: number, count: number, amplitude: number, drift: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const wave = Math.sin(i / 18) * amplitude;
    const trend = (i / count) * drift;
    const value = base + wave + trend;
    return Math.round(value * 100) / 100;
  });
}

const DAYS = tradingDays(260);

function buildRaw(ticker: Ticker, closes: number[]): RawPricePoint[] {
  return DAYS.map((date, i) => ({
    ticker,
    date,
    close: closes[i]!,
    volume: 50_000 + ((i * 37) % 25_000), // deterministic, varied
  }));
}

export const SAMPLE_RAW_PRICES: Record<Ticker, RawPricePoint[]> = {
  DANGCEM: buildRaw('DANGCEM', syntheticCloses(280, DAYS.length, 18, 40)),
  GTCO: buildRaw('GTCO', syntheticCloses(38, DAYS.length, 4, 9)),
  MTNN: buildRaw('MTNN', syntheticCloses(200, DAYS.length, 22, -30)),
};

/**
 * One sample corporate action so the adjustment is visible on the chart:
 * GTCO 1-for-10 bonus mid-series. The raw closes step down on the ex-date;
 * the adjusted series stays smooth.
 */
const GTCO_EX_DATE = DAYS[Math.floor(DAYS.length / 2)]!;

// Apply the matching raw step-down to GTCO so raw vs adjusted differ realistically.
for (const p of SAMPLE_RAW_PRICES.GTCO!) {
  if (p.date >= GTCO_EX_DATE) {
    p.close = Math.round(p.close * (10 / 11) * 100) / 100; // 1-for-10 → ×10/11
  }
}

export const SAMPLE_CORPORATE_ACTIONS: Record<Ticker, CorporateAction[]> = {
  DANGCEM: [],
  MTNN: [],
  GTCO: [
    {
      ticker: 'GTCO',
      exDate: GTCO_EX_DATE,
      type: 'bonus',
      terms: { newShares: 1, perHeld: 10 },
    },
  ],
};
