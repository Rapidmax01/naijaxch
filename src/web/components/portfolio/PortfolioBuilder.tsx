'use client';

/**
 * PortfolioBuilder — manual holdings entry → portfolio-level trend (spec §5.5).
 *
 * Signed in: holdings load from and autosave to the account (holdings table).
 * Signed out: client-only (nothing persisted/logged — G4) with a prompt to log
 * in. The portfolio adjusted series is built server-side via
 * /api/portfolio/series and rendered with the same scrubbable TrendChart.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { PriceSeries } from '@/series/types';
import type { SampleCompany } from '@/data';
import { TrendChart } from '@/web/components/TrendChart';

interface HoldingRow {
  ticker: string;
  quantity: number;
}

export function PortfolioBuilder({
  companies,
  premium = true,
}: {
  companies: SampleCompany[];
  premium?: boolean;
}) {
  const { status } = useSession();
  const authed = status === 'authenticated';

  const defaultRows: HoldingRow[] = [{ ticker: companies[0]?.ticker ?? '', quantity: 100 }];
  const [rows, setRows] = useState<HoldingRow[]>(defaultRows);
  const [series, setSeries] = useState<PriceSeries | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  const validRows = rows.filter((r) => r.ticker && r.quantity > 0);
  const holdingsKey = JSON.stringify(validRows);

  // Load saved holdings from the account once authenticated.
  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    async function load() {
      if (authed) {
        try {
          const res = await fetch('/api/portfolio/holdings');
          if (res.ok) {
            const data = (await res.json()) as { holdings?: HoldingRow[] };
            if (!cancelled && data.holdings && data.holdings.length > 0) setRows(data.holdings);
          }
        } catch {
          // keep defaults
        }
      }
      if (!cancelled) setLoaded(true);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [status, authed]);

  // Autosave holdings to the account (debounced) once loaded.
  useEffect(() => {
    if (!authed || !loaded) return;
    setSaved(false);
    const timer = setTimeout(() => {
      fetch('/api/portfolio/holdings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: JSON.parse(holdingsKey) }),
      })
        .then(() => setSaved(true))
        .catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [holdingsKey, authed, loaded]);

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

      <div className="portfolio__actions">
        <button type="button" className="portfolio__add" onClick={addRow}>
          + Add holding
        </button>
        {authed ? (
          <span className="portfolio__save">{saved ? 'Saved to your account' : 'Saving…'}</span>
        ) : (
          <span className="portfolio__save">
            <a href="/login">Log in</a> to save your portfolio
          </span>
        )}
      </div>

      <div className="portfolio__chart" aria-busy={loading}>
        {!premium ? (
          <div className="upgrade-prompt" role="note">
            <p className="upgrade-prompt__title">Portfolio-level trend is a Premium feature</p>
            <p className="upgrade-prompt__copy">
              Track your holdings free; see their combined value over time on Premium.
            </p>
            <a href="/pricing" className="upgrade-prompt__cta">
              See plans →
            </a>
          </div>
        ) : series && series.points.length > 0 ? (
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
