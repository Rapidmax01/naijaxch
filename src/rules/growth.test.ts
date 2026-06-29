import { describe, expect, it } from 'vitest';
import type { Fundamentals } from '@/data/types';
import { SAMPLE_FUNDAMENTALS } from '@/data/fixtures/sample-stocks';
import { computeGrowth, type GrowthReport } from './growth';

function f(period: string, over: Partial<Fundamentals>): Fundamentals {
  return {
    ticker: 'DEMO',
    period,
    revenue: 1000,
    netIncome: 100,
    shareCount: 100,
    dividendPerShare: 1,
    totalEquity: 500,
    totalDebt: 100,
    ...over,
  };
}

function metric(r: GrowthReport, key: string) {
  const m = r.metrics.find((x) => x.key === key);
  if (!m) throw new Error(`missing ${key}`);
  return m;
}

describe('computeGrowth', () => {
  it('returns null on empty history', () => {
    expect(computeGrowth([])).toBeNull();
  });

  it('computes YoY revenue/EPS/dividend growth from the last two periods', () => {
    const r = computeGrowth([
      f('FY2022', { revenue: 1000, netIncome: 100, dividendPerShare: 1 }),
      f('FY2023', { revenue: 1200, netIncome: 150, dividendPerShare: 1.5 }),
    ])!;
    expect(r.latestPeriod).toBe('FY2023');
    expect(r.priorPeriod).toBe('FY2022');
    expect(metric(r, 'revenueGrowth').value).toBe(20); // 1000→1200
    expect(metric(r, 'epsGrowth').value).toBe(50); // eps 1→1.5
    expect(metric(r, 'dividendGrowth').value).toBe(50); // 1→1.5
    expect(metric(r, 'revenueGrowth').display).toBe('+20.00%');
  });

  it('attaches a factual decline note on negative growth (informational, G2)', () => {
    const r = computeGrowth([
      f('FY2022', { revenue: 1000 }),
      f('FY2023', { revenue: 900 }),
    ])!;
    const rev = metric(r, 'revenueGrowth');
    expect(rev.value).toBe(-10);
    expect(rev.note).toBe('Revenue fell year-on-year.');
  });

  it('leaves YoY metrics null with a single period', () => {
    const r = computeGrowth([f('FY2023', {})])!;
    expect(r.priorPeriod).toBeNull();
    expect(metric(r, 'revenueGrowth').value).toBeNull();
    expect(metric(r, 'revenueGrowth').display).toBe('—');
  });

  it('does not compute EPS growth from a non-positive prior base', () => {
    const r = computeGrowth([
      f('FY2022', { netIncome: -50 }), // prior EPS negative
      f('FY2023', { netIncome: 100 }),
    ])!;
    expect(metric(r, 'epsGrowth').value).toBeNull();
  });

  it('computes ROE from the latest period and guards non-positive equity', () => {
    expect(metric(computeGrowth([f('FY2023', { netIncome: 100, totalEquity: 500 })])!, 'roe').value).toBe(20);
    expect(metric(computeGrowth([f('FY2023', { totalEquity: -10 })])!, 'roe').value).toBeNull();
  });

  it('flows through the real multi-year fixtures (history → growth)', () => {
    const history = SAMPLE_FUNDAMENTALS.GTCO!;
    expect(history).toHaveLength(5);
    // Ascending order, ending at the latest anchor period.
    expect(history.at(-1)!.period).toBe('FY2023');
    const r = computeGrowth(history)!;
    expect(r.periods).toBe(5);
    expect(metric(r, 'revenueGrowth').value).not.toBeNull();
    expect(metric(r, 'revenueCagr3y').value).not.toBeNull();
    expect(metric(r, 'roe').value).not.toBeNull();
  });

  it('computes revenue 3-yr CAGR only with at least four periods', () => {
    const short = computeGrowth([f('FY2022', {}), f('FY2023', {})])!;
    expect(metric(short, 'revenueCagr3y').value).toBeNull();

    // 1000 → 8000 over 3 years = 100% CAGR (doubling each year).
    const long = computeGrowth([
      f('FY2020', { revenue: 1000 }),
      f('FY2021', { revenue: 2000 }),
      f('FY2022', { revenue: 4000 }),
      f('FY2023', { revenue: 8000 }),
    ])!;
    expect(metric(long, 'revenueCagr3y').value).toBe(100);
  });
});
