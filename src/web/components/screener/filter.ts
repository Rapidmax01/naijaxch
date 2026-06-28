/**
 * Pure screener filter + sort. No React, no data access — fully unit-testable.
 * Filtering/sorting is presentational selection over already-computed rows; it
 * never produces or alters a figure (G1).
 */

import type { ScreenerFilter, ScreenerRow, Sort, SortKey } from './types';

function matchesQuery(row: ScreenerRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return row.ticker.toLowerCase().includes(q) || row.name.toLowerCase().includes(q);
}

export function filterRows(rows: ScreenerRow[], filter: ScreenerFilter): ScreenerRow[] {
  return rows.filter((row) => {
    if (filter.sector !== 'all' && row.sector !== filter.sector) return false;
    if (filter.maxPe != null) {
      if (row.pe == null || row.pe > filter.maxPe) return false;
    }
    if (filter.minDividendYield != null) {
      if (row.dividendYield == null || row.dividendYield < filter.minDividendYield) return false;
    }
    if (!matchesQuery(row, filter.query)) return false;
    return true;
  });
}

function compare(a: ScreenerRow, b: ScreenerRow, key: SortKey, dir: 'asc' | 'desc'): number {
  const av = a[key];
  const bv = b[key];

  // Nulls always sort last, regardless of direction.
  const aNull = av == null;
  const bNull = bv == null;
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;

  let cmp: number;
  if (typeof av === 'string' && typeof bv === 'string') {
    cmp = av.localeCompare(bv);
  } else {
    cmp = (av as number) - (bv as number);
  }
  return dir === 'asc' ? cmp : -cmp;
}

export function sortRows(rows: ScreenerRow[], sort: Sort): ScreenerRow[] {
  return [...rows].sort((a, b) => compare(a, b, sort.key, sort.dir));
}

export function applyScreener(
  rows: ScreenerRow[],
  filter: ScreenerFilter,
  sort: Sort,
): ScreenerRow[] {
  return sortRows(filterRows(rows, filter), sort);
}
