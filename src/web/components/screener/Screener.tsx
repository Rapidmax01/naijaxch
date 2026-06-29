'use client';

/**
 * Screener — filter and sort the NGX universe by already-computed metrics.
 * All figures come from src/series / src/rules via the server (G1); this
 * component only selects, sorts, and formats for display (TS3).
 */

import { useMemo, useState } from 'react';
import { formatCompact, formatNaira, formatPct } from '@/series';
import { sectorColor } from '@/web/lib/sectors';
import { applyScreener } from './filter';
import {
  DEFAULT_FILTER,
  SCREENER_PRESETS,
  presetToFilter,
  type ScreenerFilter,
  type ScreenerPreset,
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
  { key: 'debtToEquity', label: 'D/E', numeric: true },
  { key: 'revenueGrowth', label: 'Rev YoY', numeric: true },
  { key: 'roe', label: 'ROE', numeric: true },
  { key: 'peVsAvg', label: 'P/E vs avg', numeric: true },
  { key: 'avgVolume', label: 'Avg Vol', numeric: true },
];

function signedPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v}%`;
}

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
    case 'debtToEquity':
      return row.debtToEquity == null ? '—' : `${row.debtToEquity}x`;
    case 'avgVolume':
      return row.avgVolume == null ? '—' : formatCompact(row.avgVolume);
    case 'revenueGrowth':
      return row.revenueGrowth == null ? '—' : signedPct(row.revenueGrowth);
    case 'roe':
      return row.roe == null ? '—' : `${row.roe}%`;
    case 'peVsAvg':
      return row.peVsAvg == null ? '—' : signedPct(row.peVsAvg);
  }
}

/** Free users see the first few rows; the rest is a blurred teaser (spec §7). */
const FREE_ROW_COUNT = 4;

export function Screener({ rows, premium = true }: { rows: ScreenerRow[]; premium?: boolean }) {
  const [filter, setFilter] = useState<ScreenerFilter>(DEFAULT_FILTER);
  const [sort, setSort] = useState<Sort>({ key: 'changePct1Y', dir: 'desc' });
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const sectors = useMemo(
    () => ['all', ...Array.from(new Set(rows.map((r) => r.sector))).sort()],
    [rows],
  );
  const visible = useMemo(() => applyScreener(rows, filter, sort), [rows, filter, sort]);

  // Manual filter edits clear the active preset (the filter no longer matches it).
  function editFilter(patch: Partial<ScreenerFilter>) {
    setFilter((f) => ({ ...f, ...patch }));
    setActivePreset(null);
  }

  function applyPreset(preset: ScreenerPreset) {
    if (activePreset === preset.key) {
      setFilter(DEFAULT_FILTER);
      setActivePreset(null);
      return;
    }
    setFilter(presetToFilter(preset));
    setSort(preset.sort);
    setActivePreset(preset.key);
  }

  function reset() {
    setFilter(DEFAULT_FILTER);
    setActivePreset(null);
  }

  function toggleSort(key: SortKey) {
    setActivePreset(null);
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
      <div className="screener__presets" role="group" aria-label="Quick screens">
        {SCREENER_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`screener__preset${activePreset === p.key ? ' is-active' : ''}`}
            aria-pressed={activePreset === p.key}
            title={p.criteria}
            onClick={() => applyPreset(p)}
          >
            {p.label}
            <span className="screener__preset-criteria">{p.criteria}</span>
          </button>
        ))}
        <button type="button" className="screener__preset screener__preset--reset" onClick={reset}>
          Reset
        </button>
      </div>

      <div className="screener__filters">
        <label className="screener__field">
          <span>Search</span>
          <input
            type="search"
            placeholder="Ticker or name"
            value={filter.query}
            onChange={(e) => editFilter({ query: e.target.value })}
          />
        </label>
        <label className="screener__field">
          <span>Sector</span>
          <select value={filter.sector} onChange={(e) => editFilter({ sector: e.target.value })}>
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
            onChange={(e) => editFilter({ maxPe: numberOrNull(e.target.value) })}
          />
        </label>
        <label className="screener__field">
          <span>Min yield %</span>
          <input
            type="number"
            min={0}
            placeholder="—"
            value={filter.minDividendYield ?? ''}
            onChange={(e) => editFilter({ minDividendYield: numberOrNull(e.target.value) })}
          />
        </label>
        <label className="screener__field">
          <span>Min cover x</span>
          <input
            type="number"
            min={0}
            step={0.1}
            placeholder="—"
            value={filter.minDividendCover ?? ''}
            onChange={(e) => editFilter({ minDividendCover: numberOrNull(e.target.value) })}
          />
        </label>
        <label className="screener__field">
          <span>Min margin %</span>
          <input
            type="number"
            placeholder="—"
            value={filter.minNetMargin ?? ''}
            onChange={(e) => editFilter({ minNetMargin: numberOrNull(e.target.value) })}
          />
        </label>
        <label className="screener__field">
          <span>Max D/E x</span>
          <input
            type="number"
            min={0}
            step={0.1}
            placeholder="—"
            value={filter.maxDebtToEquity ?? ''}
            onChange={(e) => editFilter({ maxDebtToEquity: numberOrNull(e.target.value) })}
          />
        </label>
        <label className="screener__field">
          <span>Min 1Y %</span>
          <input
            type="number"
            placeholder="—"
            value={filter.minChangePct1Y ?? ''}
            onChange={(e) => editFilter({ minChangePct1Y: numberOrNull(e.target.value) })}
          />
        </label>
        <label className="screener__field">
          <span>Min rev growth %</span>
          <input
            type="number"
            placeholder="—"
            value={filter.minRevenueGrowth ?? ''}
            onChange={(e) => editFilter({ minRevenueGrowth: numberOrNull(e.target.value) })}
          />
        </label>
        <label className="screener__field screener__field--check">
          <span>Valuation</span>
          <span className="screener__check">
            <input
              type="checkbox"
              checked={filter.belowAvgPe}
              onChange={(e) => editFilter({ belowAvgPe: e.target.checked })}
            />
            Below avg P/E
          </span>
        </label>
        <label className="screener__field screener__field--check">
          <span>Liquidity</span>
          <span className="screener__check">
            <input
              type="checkbox"
              checked={filter.hideThinlyTraded}
              onChange={(e) => editFilter({ hideThinlyTraded: e.target.checked })}
            />
            Hide thinly traded
          </span>
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
                  ) : col.key === 'avgVolume' && row.thinlyTraded ? (
                    <span className="screener__thin" title="Thinly traded over the past year">
                      {cell(col.key, row)} <span className="screener__thin-tag">thin</span>
                    </span>
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
