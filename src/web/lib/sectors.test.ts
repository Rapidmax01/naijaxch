import { describe, expect, it } from 'vitest';
import { sectorColor, sectorWash } from './sectors';

describe('sectorColor', () => {
  it('returns a distinct hex per known sector', () => {
    expect(sectorColor('Financial Services')).toBe('#3b5bdb');
    expect(sectorColor('Oil & Gas')).toBe('#0b7285');
    expect(sectorColor('Financial Services')).not.toBe(sectorColor('Telecoms'));
  });
  it('falls back to a neutral for unknown sectors', () => {
    expect(sectorColor('Nonexistent')).toBe('#6b6f76');
  });
});

describe('sectorWash', () => {
  it('appends an alpha to the sector colour', () => {
    expect(sectorWash('Agriculture')).toBe('#2f9e441a');
  });
});
