'use client';

/**
 * Watchlist state — account-bound when signed in, browser-local otherwise.
 *
 * Logged out: localStorage (nothing leaves the browser; G4).
 * Logged in: persisted to the account via /api/watchlist. On first login any
 * local list is merged into the account, then localStorage is cleared.
 *
 * Component API is unchanged: { list, ready, toggle, isWatched }.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  WATCHLIST_KEY,
  parseWatchlist,
  serializeWatchlist,
  toggleTicker,
} from './storage';

function readLocal(): string[] {
  if (typeof window === 'undefined') return [];
  return parseWatchlist(window.localStorage.getItem(WATCHLIST_KEY));
}

function writeLocal(list: string[]): void {
  window.localStorage.setItem(WATCHLIST_KEY, serializeWatchlist(list));
}

async function fetchAccountList(): Promise<string[]> {
  const res = await fetch('/api/watchlist');
  if (!res.ok) return [];
  const data = (await res.json()) as { tickers?: string[] };
  return data.tickers ?? [];
}

export function useWatchlist() {
  const { status } = useSession();
  const authed = status === 'authenticated';

  const [list, setList] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;

    async function load() {
      if (authed) {
        // One-time merge of any local list into the account, then read account.
        const local = readLocal();
        if (local.length > 0) {
          await fetch('/api/watchlist/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tickers: local }),
          }).catch(() => {});
          window.localStorage.removeItem(WATCHLIST_KEY);
        }
        const account = await fetchAccountList();
        if (!cancelled) {
          setList(account);
          setReady(true);
        }
      } else {
        if (!cancelled) {
          setList(readLocal());
          setReady(true);
        }
      }
    }
    void load();

    function onStorage(e: StorageEvent) {
      if (!authed && e.key === WATCHLIST_KEY) setList(readLocal());
    }
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, [status, authed]);

  const toggle = useCallback(
    (ticker: string) => {
      setList((prev) => {
        const watching = prev.includes(ticker);
        const next = toggleTicker(prev, ticker);
        if (authed) {
          // Optimistic; persist to the account.
          fetch('/api/watchlist', {
            method: watching ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker }),
          }).catch(() => {});
        } else {
          writeLocal(next);
        }
        return next;
      });
    },
    [authed],
  );

  const isWatched = useCallback((ticker: string) => list.includes(ticker), [list]);

  return { list, ready, toggle, isWatched };
}
