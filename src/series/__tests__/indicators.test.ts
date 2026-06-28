import { describe, expect, it } from 'vitest';
import { sma } from '../indicators';

describe('sma', () => {
  it('is null until the period is reached, then the trailing mean', () => {
    expect(sma([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
  });

  it('handles a longer period', () => {
    expect(sma([2, 4, 6, 8, 10], 3)).toEqual([null, null, 4, 6, 8]);
  });

  it('period 1 returns the values themselves', () => {
    expect(sma([5, 7, 9], 1)).toEqual([5, 7, 9]);
  });

  it('all null when fewer points than the period', () => {
    expect(sma([1, 2], 5)).toEqual([null, null]);
  });

  it('rounds to avoid float drift', () => {
    expect(sma([10, 10.1, 10.2], 3)).toEqual([null, null, 10.1]);
  });

  it('throws on a non-positive period', () => {
    expect(() => sma([1, 2], 0)).toThrow();
  });
});
