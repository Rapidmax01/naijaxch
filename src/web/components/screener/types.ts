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
  /** Debt / equity (x). null if not computable. */
  debtToEquity: number | null;
  /** Mean daily volume over the trailing 1Y window (shares). */
  avgVolume: number | null;
  /** True when 1Y window volume is below the "thinly traded" threshold. */
  thinlyTraded: boolean;
}

export type SortKey =
  | 'ticker'
  | 'price'
  | 'changePct1Y'
  | 'pe'
  | 'dividendYield'
  | 'netMargin'
  | 'dividendCover'
  | 'debtToEquity'
  | 'avgVolume';

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
  /** Lower dividend-cover bound (x); rows without cover are excluded when set. */
  minDividendCover: number | null;
  /** Lower net-margin bound (%); rows without a margin are excluded when set. */
  minNetMargin: number | null;
  /** Upper debt/equity bound (x); rows without D/E are excluded when set. */
  maxDebtToEquity: number | null;
  /** Lower 1Y-change bound (%); rows without a 1Y change are excluded when set. */
  minChangePct1Y: number | null;
  /** When true, exclude rows flagged as thinly traded. */
  hideThinlyTraded: boolean;
  /** Free-text match on ticker or name. */
  query: string;
}

export const DEFAULT_FILTER: ScreenerFilter = {
  sector: 'all',
  maxPe: null,
  minDividendYield: null,
  minDividendCover: null,
  minNetMargin: null,
  maxDebtToEquity: null,
  minChangePct1Y: null,
  hideThinlyTraded: false,
  query: '',
};

/**
 * A named quick-screen: a descriptive filter shortcut (general information,
 * G2 — never a recommendation). Each shows its exact numeric criteria; clicking
 * it sets the filter + sort. No advice copy, no "buy/best/strong" language.
 */
export interface ScreenerPreset {
  key: string;
  label: string;
  /** The plain-language criteria shown on the chip. */
  criteria: string;
  filter: Partial<ScreenerFilter>;
  sort: Sort;
}

export const SCREENER_PRESETS: ScreenerPreset[] = [
  {
    key: 'high-yield',
    label: 'High yield',
    criteria: 'Dividend yield ≥ 5%',
    filter: { minDividendYield: 5 },
    sort: { key: 'dividendYield', dir: 'desc' },
  },
  {
    key: 'covered-dividend',
    label: 'Covered dividend',
    criteria: 'Dividend cover ≥ 1x',
    filter: { minDividendCover: 1 },
    sort: { key: 'dividendCover', dir: 'desc' },
  },
  {
    key: 'profitable',
    label: 'Profitable',
    criteria: 'Net margin > 0%',
    filter: { minNetMargin: 0 },
    sort: { key: 'netMargin', dir: 'desc' },
  },
  {
    key: 'low-debt',
    label: 'Low debt',
    criteria: 'Debt / equity < 1x',
    filter: { maxDebtToEquity: 1 },
    sort: { key: 'debtToEquity', dir: 'asc' },
  },
  {
    key: 'up-1y',
    label: 'Up over 1Y',
    criteria: '1Y change ≥ 0%',
    filter: { minChangePct1Y: 0 },
    sort: { key: 'changePct1Y', dir: 'desc' },
  },
];

/** Merge a preset over the defaults to a full filter (pure). */
export function presetToFilter(preset: ScreenerPreset): ScreenerFilter {
  return { ...DEFAULT_FILTER, ...preset.filter };
}
