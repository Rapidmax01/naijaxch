'use client';

/**
 * Watchlist state backed by localStorage. Browser-only persistence — nothing is
 * sent to the server or logged (G4). Syncs across tabs via the `storage` event.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  WATCHLIST_KEY,
  isWatched as isWatchedIn,
  parseWatchlist,
  serializeWatchlist,
  toggleTicker,
} from './storage';

function read(): string[] {
  if (typeof window === 'undefined') return [];
  return parseWatchlist(window.localStorage.getItem(WATCHLIST_KEY));
}

export function useWatchlist() {
  // Start empty for a stable SSR/first-paint, then hydrate from storage.
  const [list, setList] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setList(read());
    setReady(true);

    function onStorage(e: StorageEvent) {
      if (e.key === WATCHLIST_KEY) setList(read());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((ticker: string) => {
    setList((prev) => {
      const next = toggleTicker(prev, ticker);
      window.localStorage.setItem(WATCHLIST_KEY, serializeWatchlist(next));
      return next;
    });
  }, []);

  const isWatched = useCallback((ticker: string) => isWatchedIn(list, ticker), [list]);

  return { list, ready, toggle, isWatched };
}
