import { describe, expect, it } from 'vitest';
import { SAMPLE_DISCLOSURES } from '../fixtures/sample-stocks';

const VALID_TYPES = new Set([
  'results',
  'dividend',
  'board',
  'material-event',
  'corporate-action',
  'other',
]);

describe('SAMPLE_DISCLOSURES fixtures', () => {
  it('gives a profitable name well-formed, newest-first disclosures', () => {
    const items = SAMPLE_DISCLOSURES.GTCO!;
    expect(items.length).toBeGreaterThanOrEqual(2);
    for (const d of items) {
      expect(d.ticker).toBe('GTCO');
      expect(d.title.length).toBeGreaterThan(0);
      expect(VALID_TYPES.has(d.type)).toBe(true);
      expect(d.sourceUrl).toMatch(/^https?:\/\//);
      expect(Number.isNaN(Date.parse(d.publishedAt))).toBe(false);
    }
    // Newest first.
    const dates = items.map((d) => d.publishedAt);
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });

  it('every company has at least the results + dividend filings', () => {
    for (const items of Object.values(SAMPLE_DISCLOSURES)) {
      const types = items.map((d) => d.type);
      expect(types).toContain('results');
      expect(types).toContain('dividend');
    }
  });
});
