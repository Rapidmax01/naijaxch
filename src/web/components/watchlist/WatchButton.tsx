'use client';

import { useWatchlist } from './useWatchlist';

/** Toggle a ticker in the browser-local watchlist. */
export function WatchButton({ ticker }: { ticker: string }) {
  const { isWatched, toggle, ready } = useWatchlist();
  const watching = isWatched(ticker);

  return (
    <button
      type="button"
      className={`watch-btn${watching ? ' is-watching' : ''}`}
      aria-pressed={watching}
      // Avoid a hydration flash: keep neutral label until storage is read.
      onClick={() => toggle(ticker)}
    >
      {ready && watching ? '★ Watching' : '☆ Watch'}
    </button>
  );
}
