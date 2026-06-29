import { describe, expect, it } from 'vitest';
import { peHistory, type PeInput } from './valuation';

const PERIODS: PeInput[] = [
  { period: 'FY2021', eps: 2, price: 20 }, // P/E 10
  { period: 'FY2022', eps: 2, price: 24 }, // P/E 12
  { period: 'FY2023', eps: 2, price: 28 }, // P/E 14
];

describe('peHistory', () => {
  it('computes per-period P/E, the average, and the current position', () => {
    const r = peHistory(PERIODS, 9)!; // current P/E 9 vs avg 12
    expect(r.points.map((p) => p.pe)).toEqual([10, 12, 14]);
    expect(r.average).toBe(12);
    expect(r.current).toBe(9);
    expect(r.pctVsAverage).toBe(-25); // (9-12)/12*100
    expect(r.years).toBe(3);
    expect(r.note).toContain('below its 3-year average P/E');
  });

  it('phrases above-average and in-line cases', () => {
    expect(peHistory(PERIODS, 15)!.note).toContain('above its 3-year average P/E');
    expect(peHistory(PERIODS, 12)!.note).toContain('In line with its 3-year average P/E');
  });

  it('skips periods without positive earnings or a price', () => {
    const r = peHistory(
      [
        { period: 'FY2021', eps: 2, price: 20 }, // P/E 10
        { period: 'FY2022', eps: -1, price: 24 }, // loss → skipped
        { period: 'FY2023', eps: 2, price: null }, // no price → skipped
        { period: 'FY2024', eps: 2, price: 30 }, // P/E 15
      ],
      12,
    )!;
    expect(r.points.map((p) => p.period)).toEqual(['FY2021', 'FY2024']);
    expect(r.average).toBe(12.5); // (10+15)/2
  });

  it('is null with fewer than two historical points', () => {
    expect(peHistory([{ period: 'FY2023', eps: 2, price: 20 }], 10)).toBeNull();
  });

  it('is null without a positive current P/E', () => {
    expect(peHistory(PERIODS, null)).toBeNull();
    expect(peHistory(PERIODS, 0)).toBeNull();
  });
});
