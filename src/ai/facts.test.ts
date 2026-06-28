import { describe, expect, it } from 'vitest';
import type { Fundamentals } from '@/data/types';
import { computeReportCard } from '@/rules';
import { buildFacts } from './facts';
import { hasRawDigits } from './gate';

const company = { ticker: 'DEMO', name: 'Demo Plc', sector: 'Industrial Goods' };
const fundamentals: Fundamentals = {
  ticker: 'DEMO',
  period: 'FY2023',
  revenue: 1000,
  netIncome: 200,
  shareCount: 100,
  dividendPerShare: 1,
  totalEquity: 500,
  totalDebt: 250,
};

describe('buildFacts', () => {
  const card = computeReportCard(fundamentals, 20);
  const facts = buildFacts(company, card);

  it('maps metric keys to formatted values', () => {
    expect(facts.values.company).toBe('Demo Plc');
    expect(facts.values.period).toBe('FY2023');
    expect(facts.values.eps).toBe('₦2.00');
    expect(facts.allowedKeys).toContain('eps');
    expect(facts.allowedKeys).toContain('dividendCover');
  });

  it('never exposes a numeric value to the model (prompt lines carry no raw digits)', () => {
    // Each prompt line references figures only via {{placeholders}} + status words.
    for (const line of facts.promptLines) {
      expect(hasRawDigits(line)).toBe(false);
    }
  });
});
