'use client';

/**
 * PortfolioBuilder — manual holdings entry → portfolio-level trend (spec §5.5).
 *
 * Holdings are entered manually and kept in client state only (no auth/DB in
 * the Phase-1 scaffold; nothing is persisted or logged — G4). The portfolio
 * adjusted series is built server-side via /api/portfolio/series and rendered
 * with the same scrubbable TrendChart used for single stocks.
 */

import { useCallback, useEffect, useState } from 'react';
import type { PriceSeries } from '@/series/types';
import type { SampleCompany } from '@/data';
import { TrendChart } from '@/web/components/TrendChart';

interface HoldingRow {
  ticker: string;
  quantity: number;
}

export function PortfolioBuilder({ companies }: { companies: SampleCompany[] }) {
  const [rows, setRows] = useState<HoldingRow[]>([
    { ticker: companies[0]?.ticker ?? '', quantity: 100 },
  ]);
  const [series, setSeries] = useState<PriceSeries | null>(null);
  const [loading, setLoading] = useState(false);

  const validRows = rows.filter((r) => r.ticker && r.quantity > 0);
  const holdingsKey = JSON.stringify(validRows);

  const fetchSeries = useCallback(async (holdings: HoldingRow[]) => {
    if (holdings.length === 0) {
      setSeries(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings }),
      });
      if (!res.ok) throw new Error('Failed to build portfolio series');
      setSeries((await res.json()) as PriceSeries);
    } catch {
      setSeries(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const holdings: HoldingRow[] = JSON.parse(holdingsKey);
    const timer = setTimeout(() => void fetchSeries(holdings), 250); // debounce edits
    return () => clearTimeout(timer);
  }, [holdingsKey, fetchSeries]);

  function updateRow(index: number, patch: Partial<HoldingRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    const used = new Set(rows.map((r) => r.ticker));
    const next = companies.find((c) => !used.has(c.ticker)) ?? companies[0];
    if (next) setRows((prev) => [...prev, { ticker: next.ticker, quantity: 100 }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="portfolio">
      <table className="portfolio__table">
        <thead>
          <tr>
            <th scope="col">Stock</th>
            <th scope="col">Units</th>
            <th scope="col" aria-label="Remove" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>
                <label className="sr-only" htmlFor={`ticker-${i}`}>
                  Stock for row {i + 1}
                </label>
                <select
                  id={`ticker-${i}`}
                  value={row.ticker}
                  onChange={(e) => updateRow(i, { ticker: e.target.value })}
                >
                  {companies.map((c) => (
                    <option key={c.ticker} value={c.ticker}>
                      {c.ticker} — {c.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <label className="sr-only" htmlFor={`qty-${i}`}>
                  Units for row {i + 1}
                </label>
                <input
                  id={`qty-${i}`}
                  type="number"
                  min={0}
                  step={1}
                  value={row.quantity}
                  onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })}
                />
              </td>
              <td>
                <button
                  type="button"
                  className="portfolio__remove"
                  onClick={() => removeRow(i)}
                  aria-label={`Remove row ${i + 1}`}
                  disabled={rows.length === 1}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" className="portfolio__add" onClick={addRow}>
        + Add holding
      </button>

      <div className="portfolio__chart" aria-busy={loading}>
        {series && series.points.length > 0 ? (
          <TrendChart series={series} label="Portfolio value" />
        ) : (
          <p className="portfolio__empty">
            {loading ? 'Building portfolio trend…' : 'Add holdings to see your portfolio trend.'}
          </p>
        )}
      </div>
    </div>
  );
}
