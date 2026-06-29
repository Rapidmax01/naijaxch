import { describe, expect, it } from 'vitest';
import { applyScreener, filterRows, sortRows } from './filter';
import {
  DEFAULT_FILTER,
  SCREENER_PRESETS,
  presetToFilter,
  type ScreenerRow,
} from './types';

const ROWS: ScreenerRow[] = [
  { ticker: 'AAA', name: 'Alpha Bank', sector: 'Financial Services', price: 10, changePct1Y: 5, pe: 8, dividendYield: 6, netMargin: 20, dividendCover: 2, debtToEquity: 0.5, avgVolume: 120000, thinlyTraded: false },
  { ticker: 'BBB', name: 'Beta Cement', sector: 'Industrial Goods', price: 50, changePct1Y: -3, pe: 25, dividendYield: 2, netMargin: 15, dividendCover: 1.5, debtToEquity: 1.8, avgVolume: 40000, thinlyTraded: false },
  { ticker: 'CCC', name: 'Ceta Telecom', sector: 'Telecoms', price: 100, changePct1Y: 12, pe: null, dividendYield: null, netMargin: -5, dividendCover: null, debtToEquity: null, avgVolume: 200, thinlyTraded: true },
];

describe('filterRows', () => {
  it('filters by sector', () => {
    const out = filterRows(ROWS, { ...DEFAULT_FILTER, sector: 'Telecoms' });
    expect(out.map((r) => r.ticker)).toEqual(['CCC']);
  });

  it('maxPe excludes higher P/E and null-P/E rows', () => {
    const out = filterRows(ROWS, { ...DEFAULT_FILTER, maxPe: 10 });
    expect(out.map((r) => r.ticker)).toEqual(['AAA']); // BBB 25 out, CCC null out
  });

  it('minDividendYield excludes lower-yield and null-yield rows', () => {
    const out = filterRows(ROWS, { ...DEFAULT_FILTER, minDividendYield: 5 });
    expect(out.map((r) => r.ticker)).toEqual(['AAA']);
  });

  it('query matches ticker or name, case-insensitive', () => {
    expect(filterRows(ROWS, { ...DEFAULT_FILTER, query: 'cement' }).map((r) => r.ticker)).toEqual(['BBB']);
    expect(filterRows(ROWS, { ...DEFAULT_FILTER, query: 'ccc' }).map((r) => r.ticker)).toEqual(['CCC']);
  });

  it('minDividendCover excludes lower-cover and null-cover rows', () => {
    const out = filterRows(ROWS, { ...DEFAULT_FILTER, minDividendCover: 1.5 });
    expect(out.map((r) => r.ticker)).toEqual(['AAA', 'BBB']); // CCC null cover out
  });

  it('minNetMargin excludes lower-margin rows (incl. loss-makers)', () => {
    const out = filterRows(ROWS, { ...DEFAULT_FILTER, minNetMargin: 0 });
    expect(out.map((r) => r.ticker)).toEqual(['AAA', 'BBB']); // CCC -5 out
  });

  it('maxDebtToEquity excludes higher-leverage and null-D/E rows', () => {
    const out = filterRows(ROWS, { ...DEFAULT_FILTER, maxDebtToEquity: 1 });
    expect(out.map((r) => r.ticker)).toEqual(['AAA']); // BBB 1.8 out, CCC null out
  });

  it('minChangePct1Y excludes weaker 1Y movers', () => {
    const out = filterRows(ROWS, { ...DEFAULT_FILTER, minChangePct1Y: 0 });
    expect(out.map((r) => r.ticker)).toEqual(['AAA', 'CCC']); // BBB -3 out
  });

  it('hideThinlyTraded drops flagged rows only', () => {
    expect(filterRows(ROWS, { ...DEFAULT_FILTER, hideThinlyTraded: true }).map((r) => r.ticker)).toEqual([
      'AAA',
      'BBB',
    ]); // CCC thinly traded out
    expect(filterRows(ROWS, { ...DEFAULT_FILTER, hideThinlyTraded: false })).toHaveLength(3);
  });

  it('combines filters', () => {
    const out = filterRows(ROWS, { ...DEFAULT_FILTER, sector: 'Financial Services', maxPe: 10 });
    expect(out.map((r) => r.ticker)).toEqual(['AAA']);
  });
});

describe('screener presets', () => {
  it('each preset is a descriptive, non-advice filter shortcut', () => {
    // G2: criteria are factual filter bounds, never recommendation language.
    const banned = /\b(buy|sell|best|top pick|strong|should|recommend)\b/i;
    for (const p of SCREENER_PRESETS) {
      expect(p.criteria).not.toMatch(banned);
      expect(p.label).not.toMatch(banned);
    }
  });

  it('presetToFilter merges over defaults and applyScreener honours it', () => {
    const highYield = SCREENER_PRESETS.find((p) => p.key === 'high-yield')!;
    const out = applyScreener(ROWS, presetToFilter(highYield), highYield.sort);
    expect(out.map((r) => r.ticker)).toEqual(['AAA']); // only AAA yields ≥ 5%
  });

  it('low-debt preset keeps only sub-1x D/E names, sorted ascending', () => {
    const lowDebt = SCREENER_PRESETS.find((p) => p.key === 'low-debt')!;
    const out = applyScreener(ROWS, presetToFilter(lowDebt), lowDebt.sort);
    expect(out.map((r) => r.ticker)).toEqual(['AAA']);
  });
});

describe('sortRows', () => {
  it('sorts numerically ascending and descending', () => {
    expect(sortRows(ROWS, { key: 'price', dir: 'asc' }).map((r) => r.ticker)).toEqual(['AAA', 'BBB', 'CCC']);
    expect(sortRows(ROWS, { key: 'price', dir: 'desc' }).map((r) => r.ticker)).toEqual(['CCC', 'BBB', 'AAA']);
  });

  it('sorts strings by ticker', () => {
    expect(sortRows(ROWS, { key: 'ticker', dir: 'desc' }).map((r) => r.ticker)).toEqual(['CCC', 'BBB', 'AAA']);
  });

  it('always sorts nulls last', () => {
    const asc = sortRows(ROWS, { key: 'pe', dir: 'asc' });
    const desc = sortRows(ROWS, { key: 'pe', dir: 'desc' });
    expect(asc.at(-1)!.ticker).toBe('CCC'); // null pe last
    expect(desc.at(-1)!.ticker).toBe('CCC'); // null pe still last
  });

  it('does not mutate the input array', () => {
    const before = ROWS.map((r) => r.ticker);
    sortRows(ROWS, { key: 'price', dir: 'desc' });
    expect(ROWS.map((r) => r.ticker)).toEqual(before);
  });
});

describe('applyScreener', () => {
  it('filters then sorts', () => {
    const out = applyScreener(
      ROWS,
      { ...DEFAULT_FILTER, minDividendYield: 1 },
      { key: 'dividendYield', dir: 'desc' },
    );
    expect(out.map((r) => r.ticker)).toEqual(['AAA', 'BBB']); // CCC null yield filtered out
  });
});
