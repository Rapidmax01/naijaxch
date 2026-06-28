/**
 * Pure watchlist storage helpers — no React, no direct localStorage access here
 * (the hook owns I/O). Testable list operations + safe (de)serialization.
 *
 * The watchlist lives only in the user's browser (localStorage); it is never
 * sent to the server or logged (G4). It holds ticker symbols only — no PII.
 */

export const WATCHLIST_KEY = 'naijaxch.watchlist';

/** Parse stored JSON into a clean string[] — tolerant of corrupt/missing data. */
export function parseWatchlist(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

export function serializeWatchlist(list: string[]): string {
  return JSON.stringify(list);
}

export function isWatched(list: string[], ticker: string): boolean {
  return list.includes(ticker);
}

export function addTicker(list: string[], ticker: string): string[] {
  return list.includes(ticker) ? list : [...list, ticker];
}

export function removeTicker(list: string[], ticker: string): string[] {
  return list.filter((t) => t !== ticker);
}

export function toggleTicker(list: string[], ticker: string): string[] {
  return list.includes(ticker) ? removeTicker(list, ticker) : addTicker(list, ticker);
}
