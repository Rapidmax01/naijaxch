import { describe, expect, it } from 'vitest';
import type { Fundamentals } from '@/data/types';
import { computeReportCard, type Metric } from './report-card';

function metric(card: ReturnType<typeof computeReportCard>, key: string): Metric {
  const m = card.metrics.find((x) => x.key === key);
  if (!m) throw new Error(`missing metric ${key}`);
  return m;
}

/** Clean, profitable company with hand-computable ratios. */
const HEALTHY: Fundamentals = {
  ticker: 'GOOD',
  period: 'FY2023',
  revenue: 1000,
  netIncome: 200,
  shareCount: 100,
  dividendPerShare: 1,
  totalEquity: 500,
  totalDebt: 250,
};

describe('computeReportCard — healthy company at price ₦20', () => {
  const card = computeReportCard(HEALTHY, 20);

  it('EPS = netIncome / shares', () => {
    expect(metric(card, 'eps').value).toBe(2); // 200/100
    expect(metric(card, 'eps').status).toBe('good');
  });

  it('P/E = price / EPS', () => {
    expect(metric(card, 'pe').value).toBe(10); // 20/2
  });

  it('dividend cover = EPS / DPS', () => {
    expect(metric(card, 'dividendCover').value).toBe(2); // 2/1
    expect(metric(card, 'dividendCover').status).toBe('good');
  });

  it('dividend yield = DPS / price', () => {
    expect(metric(card, 'dividendYield').value).toBe(5); // 1/20*100
  });

  it('net margin = netIncome / revenue', () => {
    expect(metric(card, 'netMargin').value).toBe(20); // 200/1000*100
    expect(metric(card, 'netMargin').status).toBe('good');
  });

  it('debt/equity = debt / equity', () => {
    expect(metric(card, 'debtToEquity').value).toBe(0.5); // 250/500
    expect(metric(card, 'debtToEquity').status).toBe('good');
  });

  it('has no watch flags', () => {
    expect(card.flags).toHaveLength(0);
  });

  it('summary tallies metric statuses (general information, not a grade)', () => {
    // eps/cover/margin/de good (4), pe/yield neutral (2), no watch.
    expect(card.summary).toEqual({ good: 4, neutral: 2, watch: 0 });
    const total = card.summary.good + card.summary.neutral + card.summary.watch;
    expect(total).toBe(card.metrics.length);
  });
});

describe('dividend cover below 1', () => {
  it('flags when declared dividend exceeds EPS', () => {
    const card = computeReportCard({ ...HEALTHY, dividendPerShare: 3 }, 20); // EPS 2, DPS 3
    const cover = metric(card, 'dividendCover');
    expect(cover.value).toBe(0.67); // 2/3 rounded
    expect(cover.status).toBe('watch');
    expect(card.flags).toContain(
      'Dividend cover is below 1 — the declared dividend exceeded earnings this period.',
    );
    expect(card.summary.watch).toBeGreaterThanOrEqual(1); // cover counted as watch
  });
});

describe('loss-making period', () => {
  const card = computeReportCard({ ...HEALTHY, netIncome: -50 }, 20);

  it('EPS negative → watch with a loss note', () => {
    const eps = metric(card, 'eps');
    expect(eps.value).toBe(-0.5);
    expect(eps.status).toBe('watch');
  });

  it('P/E is not computable with no positive earnings', () => {
    const pe = metric(card, 'pe');
    expect(pe.value).toBeNull();
    expect(pe.display).toBe('—');
  });

  it('net margin negative → watch', () => {
    expect(metric(card, 'netMargin').status).toBe('watch');
  });
});

describe('negative equity', () => {
  it('debt/equity not computable, flagged', () => {
    const card = computeReportCard({ ...HEALTHY, totalEquity: -10 }, 20);
    const de = metric(card, 'debtToEquity');
    expect(de.value).toBeNull();
    expect(de.status).toBe('watch');
    expect(card.flags).toContain('Shareholder equity is negative — liabilities exceed assets.');
  });
});

describe('no dividend declared', () => {
  it('shows "No dividend" without a watch flag', () => {
    const card = computeReportCard({ ...HEALTHY, dividendPerShare: 0 }, 20);
    const cover = metric(card, 'dividendCover');
    expect(cover.display).toBe('No dividend');
    expect(cover.status).toBe('neutral');
  });
});

describe('degenerate inputs do not throw', () => {
  it('zero shares → EPS null', () => {
    const card = computeReportCard({ ...HEALTHY, shareCount: 0 }, 20);
    expect(metric(card, 'eps').value).toBeNull();
  });
});
