/**
 * Sector-context service: compares a company's computed metrics to the median
 * of its sector peers. Reuses the screener's universe rows (every figure is
 * already computed in src/rules / src/series — G1) and only takes medians +
 * positions. General information (G2), never advice.
 */

import { median, sectorPosition, type SectorPosition } from '@/rules';
import type { Ticker } from '@/data/types';
import { getScreenerRows } from './screener';

/** Metrics compared against the sector. Keys index a ScreenerRow numeric field. */
const COMPARABLES: { key: 'dividendYield' | 'pe' | 'netMargin'; label: string; unit: string }[] = [
  { key: 'dividendYield', label: 'Dividend yield', unit: '%' },
  { key: 'pe', label: 'P/E', unit: 'x' },
  { key: 'netMargin', label: 'Net margin', unit: '%' },
];

export interface SectorContextItem {
  key: string;
  label: string;
  unit: string;
  value: number | null;
  median: number | null;
  position: SectorPosition | null;
}

export interface SectorContext {
  sector: string;
  /** Number of tracked names in the sector (including this one). */
  peerCount: number;
  items: SectorContextItem[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function getSectorContext(ticker: Ticker): Promise<SectorContext | null> {
  const rows = await getScreenerRows();
  const self = rows.find((r) => r.ticker === ticker.toUpperCase());
  if (!self) return null;

  const peers = rows.filter((r) => r.sector === self.sector);

  const items: SectorContextItem[] = COMPARABLES.map((c) => {
    const values = peers
      .map((p) => p[c.key])
      .filter((v): v is number => v != null);
    const med = median(values);
    const value = self[c.key];
    return {
      key: c.key,
      label: c.label,
      unit: c.unit,
      value,
      median: med == null ? null : round2(med),
      position: sectorPosition(value, med),
    };
  });

  return { sector: self.sector, peerCount: peers.length, items };
}
