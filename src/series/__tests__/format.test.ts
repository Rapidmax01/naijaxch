import { describe, expect, it } from 'vitest';
import { formatCompact } from '../format';

describe('formatCompact', () => {
  it('formats thousands, millions, billions', () => {
    expect(formatCompact(250_000)).toBe('250K');
    expect(formatCompact(1_500_000)).toBe('1.5M');
    expect(formatCompact(2_300_000_000)).toBe('2.3B');
  });
  it('rounds small thousands and leaves units bare', () => {
    expect(formatCompact(1_234)).toBe('1K');
    expect(formatCompact(820)).toBe('820');
  });
});
