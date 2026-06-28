'use client';

/**
 * Watchlist view — shows the user's watched names with key computed metrics.
 * Rows are passed in from the server (already-computed figures, G1); this
 * component selects the watched subset from browser-local state (G4).
 */

import { formatNaira, formatPct } from '@/series';
import type { ScreenerRow } from '../screener/types';
import { useWatchlist } from './useWatchlist';

export function WatchlistView({ rows }: { rows: ScreenerRow[] }) {
  const { list, ready, toggle } = useWatchlist();

  if (!ready) {
    return <p className="watchlist__empty">Loading your watchlist…</p>;
  }

  const watched = rows.filter((r) => list.includes(r.ticker));

  if (watched.length === 0) {
    return (
      <p className="watchlist__empty">
        Your watchlist is empty. Add names from the <a href="/screener">screener</a> or any stock
        page.
      </p>
    );
  }

  return (
    <table className="screener__table">
      <thead>
        <tr>
          <th>Stock</th>
          <th className="is-numeric">Price</th>
          <th className="is-numeric">1Y</th>
          <th className="is-numeric">Yield</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {watched.map((r) => (
          <tr key={r.ticker}>
            <td>
              <a href={`/stocks/${r.ticker}`}>
                <strong>{r.ticker}</strong>
                <span className="screener__name">{r.name}</span>
              </a>
            </td>
            <td className="is-numeric">{formatNaira(r.price)}</td>
            <td className="is-numeric">{r.changePct1Y == null ? '—' : formatPct(r.changePct1Y)}</td>
            <td className="is-numeric">
              {r.dividendYield == null ? '—' : `${r.dividendYield}%`}
            </td>
            <td className="is-numeric">
              <button
                type="button"
                className="watchlist__remove"
                aria-label={`Remove ${r.ticker} from watchlist`}
                onClick={() => toggle(r.ticker)}
              >
                ✕
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
