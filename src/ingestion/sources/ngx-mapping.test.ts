import { describe, expect, it } from 'vitest';
import { cleanActions, cleanFundamentals, cleanPrices } from '../validate';
import { mapAction, mapCompany, mapFundamentals, mapPrice } from './ngx-mapping';

describe('mapCompany', () => {
  it('maps and uppercases the symbol', () => {
    expect(mapCompany({ symbol: 'gtco', name: 'GTCO Plc', sector: 'Financials' })).toEqual({
      ticker: 'GTCO',
      name: 'GTCO Plc',
      sector: 'Financials',
      sharesOutstanding: undefined,
    });
  });
  it('parses comma-formatted share counts', () => {
    expect(mapCompany({ symbol: 'X', sharesOutstanding: '29,430,000,000' }).sharesOutstanding).toBe(
      29_430_000_000,
    );
  });
});

describe('mapPrice', () => {
  it('normalizes datetime to ISO date and parses numbers', () => {
    const p = mapPrice('GTCO', { date: '2024-12-31T16:00:00Z', close: '46.20', volume: '1,234' });
    expect(p).toEqual({ ticker: 'GTCO', date: '2024-12-31', close: 46.2, volume: 1234 });
  });
  it('produces a row the clean layer accepts/rejects correctly', () => {
    const good = mapPrice('X', { date: '2024-01-01', close: 10, volume: 100 });
    const bad = mapPrice('X', { date: 'nope', close: 'x', volume: 5 });
    expect(cleanPrices([good, bad]).map((p) => p.date)).toEqual(['2024-01-01']);
  });
});

describe('mapAction', () => {
  it('maps a bonus', () => {
    expect(mapAction('X', { exDate: '2024-06-01', type: 'Bonus', newShares: 1, perHeld: 10 })).toEqual(
      { ticker: 'X', exDate: '2024-06-01', type: 'bonus', terms: { newShares: 1, perHeld: 10 } },
    );
  });
  it('maps a rights issue with subscription + cum price', () => {
    const a = mapAction('X', {
      exDate: '2024-06-01',
      type: 'rights',
      newShares: 1,
      perHeld: 2,
      subscriptionPrice: 7,
      cumPrice: 10,
    })!;
    expect(a.type).toBe('rights');
    expect(a.terms).toEqual({ newShares: 1, perHeld: 2, subscriptionPrice: 7, cumPrice: 10 });
  });
  it('returns null for unknown action types', () => {
    expect(mapAction('X', { exDate: '2024-06-01', type: 'merger' })).toBeNull();
  });
  it('mapped actions survive the clean layer', () => {
    const a = mapAction('X', { exDate: '2024-06-01', type: 'bonus', newShares: 1, perHeld: 4 })!;
    expect(cleanActions([a])).toHaveLength(1);
  });
});

describe('mapFundamentals', () => {
  it('maps period + figures', () => {
    const f = mapFundamentals('X', {
      period: 'FY2023',
      revenue: '1,000',
      netIncome: 200,
      shareCount: 100,
      dividendPerShare: 1,
      totalEquity: 500,
      totalDebt: 250,
    });
    expect(f.revenue).toBe(1000);
    expect(cleanFundamentals([f])).toHaveLength(1);
  });
});
