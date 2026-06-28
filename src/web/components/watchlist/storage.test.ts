import { describe, expect, it } from 'vitest';
import {
  addTicker,
  isWatched,
  parseWatchlist,
  removeTicker,
  serializeWatchlist,
  toggleTicker,
} from './storage';

describe('parseWatchlist', () => {
  it('returns [] for null/empty/corrupt input', () => {
    expect(parseWatchlist(null)).toEqual([]);
    expect(parseWatchlist('')).toEqual([]);
    expect(parseWatchlist('not json')).toEqual([]);
    expect(parseWatchlist('{"a":1}')).toEqual([]); // not an array
  });

  it('keeps only string entries', () => {
    expect(parseWatchlist('["GTCO", 5, "MTNN", null]')).toEqual(['GTCO', 'MTNN']);
  });

  it('round-trips through serialize', () => {
    const list = ['DANGCEM', 'GTCO'];
    expect(parseWatchlist(serializeWatchlist(list))).toEqual(list);
  });
});

describe('list operations', () => {
  it('add is idempotent', () => {
    expect(addTicker(['GTCO'], 'GTCO')).toEqual(['GTCO']);
    expect(addTicker(['GTCO'], 'MTNN')).toEqual(['GTCO', 'MTNN']);
  });

  it('remove drops the ticker', () => {
    expect(removeTicker(['GTCO', 'MTNN'], 'GTCO')).toEqual(['MTNN']);
    expect(removeTicker(['GTCO'], 'NOPE')).toEqual(['GTCO']);
  });

  it('toggle adds then removes', () => {
    expect(toggleTicker([], 'GTCO')).toEqual(['GTCO']);
    expect(toggleTicker(['GTCO'], 'GTCO')).toEqual([]);
  });

  it('isWatched reflects membership', () => {
    expect(isWatched(['GTCO'], 'GTCO')).toBe(true);
    expect(isWatched(['GTCO'], 'MTNN')).toBe(false);
  });

  it('does not mutate the input on add/remove', () => {
    const list = ['GTCO'];
    addTicker(list, 'MTNN');
    removeTicker(list, 'GTCO');
    expect(list).toEqual(['GTCO']);
  });
});
