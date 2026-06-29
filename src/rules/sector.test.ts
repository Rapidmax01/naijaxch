import { describe, expect, it } from 'vitest';
import { median, sectorPosition } from './sector';

describe('median', () => {
  it('odd count returns the middle value', () => {
    expect(median([3, 1, 2])).toBe(2);
  });
  it('even count averages the two middle values', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it('ignores non-finite values', () => {
    expect(median([1, Number.NaN, 3])).toBe(2);
  });
  it('is null with no values', () => {
    expect(median([])).toBeNull();
  });
});

describe('sectorPosition', () => {
  it('flags above / below the median beyond the epsilon band', () => {
    expect(sectorPosition(10, 5)).toBe('above');
    expect(sectorPosition(2, 5)).toBe('below');
  });
  it('treats near-median values as inline', () => {
    expect(sectorPosition(5.05, 5)).toBe('inline'); // 1% gap < 2% epsilon
  });
  it('handles a zero median', () => {
    expect(sectorPosition(1, 0)).toBe('above');
    expect(sectorPosition(-1, 0)).toBe('below');
    expect(sectorPosition(0, 0)).toBe('inline');
  });
  it('is null when either side is missing', () => {
    expect(sectorPosition(null, 5)).toBeNull();
    expect(sectorPosition(5, null)).toBeNull();
  });
});
