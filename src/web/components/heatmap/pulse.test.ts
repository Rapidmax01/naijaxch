import { describe, expect, it } from 'vitest';
import { changeColor, computePulse } from './pulse';
import type { ScreenerRow } from '../screener/types';

function row(ticker: string, changePct1Y: number | null): ScreenerRow {
  return {
    ticker,
    name: ticker,
    sector: 'X',
    price: 10,
    changePct1Y,
    pe: null,
    dividendYield: null,
    netMargin: null,
    dividendCover: null,
    debtToEquity: null,
  };
}

describe('computePulse', () => {
  it('counts advancers, decliners, unchanged', () => {
    const p = computePulse([row('A', 5), row('B', -3), row('C', 0), row('D', 8)]);
    expect(p.advancers).toBe(2);
    expect(p.decliners).toBe(1);
    expect(p.unchanged).toBe(1);
    expect(p.total).toBe(4);
  });

  it('averages 1Y change, rounded 2 dp', () => {
    const p = computePulse([row('A', 10), row('B', -3), row('C', 2)]);
    expect(p.avgChange).toBe(3); // (10 - 3 + 2)/3 = 3
  });

  it('ignores rows without a change value', () => {
    const p = computePulse([row('A', 4), row('B', null)]);
    expect(p.total).toBe(1);
    expect(p.avgChange).toBe(4);
  });

  it('returns null average when no data', () => {
    const p = computePulse([row('A', null)]);
    expect(p.total).toBe(0);
    expect(p.avgChange).toBeNull();
  });
});

describe('changeColor', () => {
  it('is green for gains, red for losses', () => {
    expect(changeColor(5)).toContain('22, 163, 74');
    expect(changeColor(-5)).toContain('220, 38, 38');
  });

  it('scales alpha with magnitude', () => {
    const small = changeColor(1);
    const large = changeColor(10);
    const alpha = (s: string) => Number(s.match(/,\s*([\d.]+)\)$/)![1]);
    expect(alpha(large)).toBeGreaterThan(alpha(small));
  });

  it('caps intensity beyond the full-intensity threshold', () => {
    expect(changeColor(10)).toBe(changeColor(50));
  });

  it('is neutral for null/zero', () => {
    expect(changeColor(null)).toContain('100, 116, 139');
    expect(changeColor(0)).toContain('100, 116, 139');
  });
});
