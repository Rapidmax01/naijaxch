import { describe, expect, it } from 'vitest';
import type { PriceSeries } from '../types';
import { buildPortfolioSeries, type Holding } from '../portfolio';

function series(ticker: string, rows: Array<[string, number]>): PriceSeries {
  return {
    ticker,
    points: rows.map(([date, adjClose]) => ({
      ticker,
      date,
      close: adjClose,
      adjClose,
      volume: 1000,
      adjFactor: 1,
    })),
  };
}

describe('buildPortfolioSeries', () => {
  it('sums quantity × adjClose per day', () => {
    const a = series('AAA', [
      ['2024-01-01', 10],
      ['2024-01-02', 12],
    ]);
    const b = series('BBB', [
      ['2024-01-01', 5],
      ['2024-01-02', 6],
    ]);
    const holdings: Holding[] = [
      { ticker: 'AAA', quantity: 100 },
      { ticker: 'BBB', quantity: 200 },
    ];
    const p = buildPortfolioSeries(holdings, new Map([['AAA', a], ['BBB', b]]));
    expect(p.points.map((pt) => pt.adjClose)).toEqual([
      100 * 10 + 200 * 5, // 2000
      100 * 12 + 200 * 6, // 2400
    ]);
  });

  it('forward-fills a holding that did not trade on a day', () => {
    const a = series('AAA', [
      ['2024-01-01', 10],
      ['2024-01-03', 20], // no 01-02 row
    ]);
    const b = series('BBB', [
      ['2024-01-01', 5],
      ['2024-01-02', 5],
      ['2024-01-03', 5],
    ]);
    const p = buildPortfolioSeries(
      [{ ticker: 'AAA', quantity: 1 }, { ticker: 'BBB', quantity: 1 }],
      new Map([['AAA', a], ['BBB', b]]),
    );
    const byDate = Object.fromEntries(p.points.map((pt) => [pt.date, pt.adjClose]));
    expect(byDate['2024-01-02']).toBe(10 + 5); // AAA carried at 10
    expect(byDate['2024-01-03']).toBe(20 + 5);
  });

  it('starts where every holding has data', () => {
    const a = series('AAA', [['2024-01-01', 10], ['2024-01-02', 10]]);
    const b = series('BBB', [['2024-01-02', 5]]); // starts later
    const p = buildPortfolioSeries(
      [{ ticker: 'AAA', quantity: 1 }, { ticker: 'BBB', quantity: 1 }],
      new Map([['AAA', a], ['BBB', b]]),
    );
    expect(p.points[0]!.date).toBe('2024-01-02');
  });

  it('returns empty when a holding has no price data', () => {
    const a = series('AAA', [['2024-01-01', 10]]);
    const p = buildPortfolioSeries(
      [{ ticker: 'AAA', quantity: 1 }, { ticker: 'MISSING', quantity: 1 }],
      new Map([['AAA', a]]),
    );
    expect(p.points).toHaveLength(0);
  });
});
