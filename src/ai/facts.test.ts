import { describe, expect, it } from 'vitest';
import type { Fundamentals } from '@/data/types';
import { computeGrowth, computeReportCard, peHistory } from '@/rules';
import { buildFacts } from './facts';
import { hasRawDigits, validateNarration } from './gate';

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

describe('buildFacts with growth + valuation (0007)', () => {
  // Two ascending periods → revenue/EPS growth + ROE; explicit P/E history.
  const history: Fundamentals[] = [
    { ...fundamentals, period: 'FY2022', revenue: 800, netIncome: 160 },
    { ...fundamentals, period: 'FY2023', revenue: 1000, netIncome: 200 },
  ];
  const card = computeReportCard(history[1]!, 20);
  const growth = computeGrowth(history);
  const valuation = peHistory(
    [
      { period: 'FY2022', eps: 1.6, price: 16 }, // P/E 10
      { period: 'FY2023', eps: 2, price: 28 }, // P/E 14
    ],
    9, // current P/E below the average → "below average"
  );

  const facts = buildFacts(company, card, growth, valuation);

  it('adds growth + valuation placeholders to the values + allowed keys', () => {
    expect(facts.allowedKeys).toContain('revenueGrowth');
    expect(facts.allowedKeys).toContain('roe');
    expect(facts.allowedKeys).toContain('peContext');
    expect(facts.values.revenueGrowth).toBe('+25.00%'); // 800 → 1000
    expect(facts.values.peContext).toMatch(/average P\/E/);
  });

  it('still shows the model no raw figures (direction words only)', () => {
    for (const line of facts.promptLines) {
      expect(hasRawDigits(line)).toBe(false);
    }
  });

  it('offers no growth/valuation placeholders when not computable (fail-safe)', () => {
    const bare = buildFacts(company, card, null, null);
    expect(bare.allowedKeys).not.toContain('revenueGrowth');
    expect(bare.allowedKeys).not.toContain('peContext');
  });

  it('a narration using the new tokens passes the gate end to end', () => {
    const narration =
      'The data shows revenue grew {{revenueGrowth}} with a return on equity of {{roe}}. {{peContext}}';
    expect(validateNarration(narration, facts.allowedKeys).ok).toBe(true);
  });
});
