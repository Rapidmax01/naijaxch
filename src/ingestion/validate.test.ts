import { describe, expect, it } from 'vitest';
import type { CorporateAction, Fundamentals, RawPricePoint } from '@/data/types';
import {
  cleanActions,
  cleanFundamentals,
  cleanPrices,
  isValidDate,
  isValidPrice,
} from './validate';

function price(date: string, close: number, volume = 1000): RawPricePoint {
  return { ticker: 'X', date, close, volume };
}

describe('isValidDate', () => {
  it('accepts ISO YYYY-MM-DD, rejects others', () => {
    expect(isValidDate('2024-01-15')).toBe(true);
    expect(isValidDate('2024-1-5')).toBe(false);
    expect(isValidDate('15/01/2024')).toBe(false);
    expect(isValidDate('2024-13-99')).toBe(false);
  });
});

describe('isValidPrice', () => {
  it('requires positive finite close and non-negative volume', () => {
    expect(isValidPrice(price('2024-01-01', 10))).toBe(true);
    expect(isValidPrice(price('2024-01-01', 0))).toBe(false);
    expect(isValidPrice(price('2024-01-01', -5))).toBe(false);
    expect(isValidPrice(price('2024-01-01', NaN))).toBe(false);
    expect(isValidPrice(price('2024-01-01', 10, -1))).toBe(false);
  });
});

describe('cleanPrices', () => {
  it('drops invalid rows, dedupes by date (last wins), sorts', () => {
    const out = cleanPrices([
      price('2024-01-02', 12),
      price('2024-01-01', 10),
      price('2024-01-01', 11), // dup date → last wins
      price('2024-01-03', -1), // invalid
    ]);
    expect(out.map((p) => [p.date, p.close])).toEqual([
      ['2024-01-01', 11],
      ['2024-01-02', 12],
    ]);
  });
});

describe('cleanActions', () => {
  const a = (exDate: string, type: string): CorporateAction => ({
    ticker: 'X',
    exDate,
    type: type as CorporateAction['type'],
    terms: { newShares: 1, perHeld: 4 },
  });

  it('dedupes on ticker+exDate+type and drops unknown types', () => {
    const out = cleanActions([
      a('2024-06-01', 'bonus'),
      a('2024-06-01', 'bonus'), // dup
      a('2024-06-01', 'rights'), // distinct type
      a('2024-06-01', 'merger'), // invalid type
    ]);
    expect(out).toHaveLength(2);
  });
});

describe('cleanFundamentals', () => {
  const f = (period: string, shareCount: number): Fundamentals => ({
    ticker: 'X',
    period,
    revenue: 100,
    netIncome: 10,
    shareCount,
    dividendPerShare: 1,
    totalEquity: 50,
    totalDebt: 25,
  });

  it('dedupes on period and drops negative share counts', () => {
    const out = cleanFundamentals([f('FY2023', 100), f('FY2023', 200), f('FY2022', -1)]);
    expect(out).toHaveLength(1);
    expect(out[0]!.shareCount).toBe(200); // last FY2023 wins
  });
});
