'use client';

/**
 * Screener — filter and sort the NGX universe by already-computed metrics.
 * All figures come from src/series / src/rules via the server (G1); this
 * component only selects, sorts, and formats for display (TS3).
 */

import { useMemo, useState } from 'react';
import { formatNaira, formatPct } from '@/series';
import { sectorColor } from '@/web/lib/sectors';
import { applyScreener } from './filter';
import {
  DEFAULT_FILTER,
  type ScreenerFilter,
  type ScreenerRow,
  type Sort,
  type SortKey,
} from './types';

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'ticker', label: 'Stock', numeric: false },
  { key: 'price', label: 'Price', numeric: true },
  { key: 'changePct1Y', label: '1Y', numeric: true },
  { key: 'pe', label: 'P/E', numeric: true },
  { key: 'dividendYield', label: 'Yield', numeric: true },
  { key: 'netMargin', label: 'Margin', numeric: true },
  { key: 'dividendCover', label: 'Cover', numeric: true },
];

function cell(key: SortKey, row: ScreenerRow): string {
  switch (key) {
    case 'ticker':
      return row.ticker;
    case 'price':
      return formatNaira(row.price);
    case 'changePct1Y':
      return row.changePct1Y == null ? '—' : formatPct(row.changePct1Y);
    case 'pe':
      return row.pe == null ? '—' : `${row.pe}x`;
    case 'dividendYield':
      return row.dividendYield == null ? '—' : `${row.dividendYield}%`;
    case 'netMargin':
      return row.netMargin == null ? '—' : `${row.netMargin}%`;
    case 'dividendCover':
      return row.dividendCover == null ? '—' : `${row.dividendCover}x`;
  }
}

/** Free users see the first few rows; the rest is a blurred teaser (spec §7). */
const FREE_ROW_COUNT = 4;

export function Screener({ rows, premium = true }: { rows: ScreenerRow[]; premium?: boolean }) {
  const [filter, setFilter] = useState<ScreenerFilter>(DEFAULT_FILTER);
  const [sort, setSort] = useState<Sort>({ key: 'changePct1Y', dir: 'desc' });

  const sectors = useMemo(
    () => ['all', ...Array.from(new Set(rows.map((r) => r.sector))).sort()],
    [rows],
  );
  const visible = useMemo(() => applyScreener(rows, filter, sort), [rows, filter, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'ticker' ? 'asc' : 'desc' },
    );
  }

  function numberOrNull(value: string): number | null {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }

  return (
    <div className="screener">
      <div className="screener__filters">
        <label className="screener__field">
          <span>Search</span>
          <input
            type="search"
            placeholder="Ticker or name"
            value={filter.query}
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
          />
        </label>
        <label className="screener__field">
          <span>Sector</span>
          <select
            value={filter.sector}
            onChange={(e) => setFilter((f) => ({ ...f, sector: e.target.value }))}
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All sectors' : s}
              </option>
            ))}
          </select>
        </label>
        <label className="screener__field">
          <span>Max P/E</span>
          <input
            type="number"
            min={0}
            placeholder="—"
            value={filter.maxPe ?? ''}
            onChange={(e) => setFilter((f) => ({ ...f, maxPe: numberOrNull(e.target.value) }))}
          />
        </label>
        <label className="screener__field">
          <span>Min yield %</span>
          <input
            type="number"
            min={0}
            placeholder="—"
            value={filter.minDividendYield ?? ''}
            onChange={(e) =>
              setFilter((f) => ({ ...f, minDividendYield: numberOrNull(e.target.value) }))
            }
          />
        </label>
      </div>

      <table className="screener__table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} className={col.numeric ? 'is-numeric' : ''}>
                <button type="button" onClick={() => toggleSort(col.key)} aria-label={`Sort by ${col.label}`}>
                  {col.label}
                  {sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, i) => (
            <tr key={row.ticker} className={!premium && i >= FREE_ROW_COUNT ? 'is-locked-row' : ''}>
              {COLUMNS.map((col) => (
                <td key={col.key} className={col.numeric ? 'is-numeric' : ''}>
                  {col.key === 'ticker' ? (
                    <a
                      href={`/stocks/${row.ticker}`}
                      className="screener__stock"
                      style={{ ['--sector' as string]: sectorColor(row.sector) }}
                    >
                      <span className="dot" aria-hidden />
                      <span className="screener__id">
                        <strong>{row.ticker}</strong>
                        <span className="screener__name">{row.name}</span>
                      </span>
                    </a>
                  ) : (
                    cell(col.key, row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {!premium && visible.length > FREE_ROW_COUNT && (
        <p className="screener__locked">
          Full screener results are a Premium feature. <a href="/pricing">See plans →</a>
        </p>
      )}

      <p className="screener__count">
        {visible.length} of {rows.length} {rows.length === 1 ? 'stock' : 'stocks'}
      </p>
    </div>
  );
}
