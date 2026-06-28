/**
 * Screener data shapes. A ScreenerRow carries only already-computed figures
 * from src/series and src/rules (G1) — the screener never derives numbers.
 */

export interface ScreenerRow {
  ticker: string;
  name: string;
  sector: string;
  /** Latest adjusted close (₦). */
  price: number;
  /** Net change over the trailing 1Y window (%). null if not computable. */
  changePct1Y: number | null;
  pe: number | null;
  dividendYield: number | null;
  netMargin: number | null;
  dividendCover: number | null;
}

export type SortKey =
  | 'ticker'
  | 'price'
  | 'changePct1Y'
  | 'pe'
  | 'dividendYield'
  | 'netMargin'
  | 'dividendCover';

export interface Sort {
  key: SortKey;
  dir: 'asc' | 'desc';
}

export interface ScreenerFilter {
  sector: string; // 'all' or a specific sector
  /** Upper P/E bound; rows without a P/E (loss-makers) are excluded when set. */
  maxPe: number | null;
  /** Lower dividend-yield bound (%); rows without a yield are excluded when set. */
  minDividendYield: number | null;
  /** Free-text match on ticker or name. */
  query: string;
}

export const DEFAULT_FILTER: ScreenerFilter = {
  sector: 'all',
  maxPe: null,
  minDividendYield: null,
  query: '',
};
