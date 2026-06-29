/**
 * Growth metrics from a fundamentals history (proposal 0006, Phase A).
 *
 * Pure, deterministic (decimal.js — G1), rounded for display (TS3). General
 * information only (G2): year-on-year context, never advice. Metrics are
 * INFORMATIONAL — we attach a factual note on a clear signal (e.g. a decline)
 * but never colour growth as a recommendation. Insufficient history → null.
 */

import Decimal from 'decimal.js';
import type { Fundamentals } from '@/data/types';

export interface GrowthMetric {
  key: string;
  label: string;
  /** Rounded value (percent), or null when not computable. */
  value: number | null;
  /** Pre-formatted display string with sign (e.g. "+12.50%"). */
  display: string;
  /** Neutral factual note on a notable reading (G2). */
  note?: string;
}

export interface GrowthReport {
  ticker: string;
  /** Latest period label (e.g. FY2023). */
  latestPeriod: string;
  /** Prior period label, or null with <2 periods. */
  priorPeriod: string | null;
  /** Number of periods available. */
  periods: number;
  metrics: GrowthMetric[];
}

function pct(d: Decimal): number {
  return d.toDecimalPlaces(2).toNumber();
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function eps(f: Fundamentals): Decimal | null {
  const shares = new Decimal(f.shareCount);
  return shares.isZero() ? null : new Decimal(f.netIncome).div(shares);
}

/** Year-on-year % change, defined only when the prior base is positive. */
function yoy(curr: Decimal | null, prev: Decimal | null): number | null {
  if (curr == null || prev == null || !prev.gt(0)) return null;
  return pct(curr.minus(prev).div(prev).times(100));
}

function metric(key: string, label: string, value: number | null, declineNote: string): GrowthMetric {
  return {
    key,
    label,
    value,
    display: value == null ? '—' : signed(value),
    note: value != null && value < 0 ? declineNote : undefined,
  };
}

/**
 * Compute the growth report. `history` is ascending by period. Returns null only
 * when there is no history at all; individual metrics are null when there are
 * too few periods.
 */
export function computeGrowth(history: Fundamentals[]): GrowthReport | null {
  if (history.length === 0) return null;

  const latest = history[history.length - 1]!;
  const prior = history.length >= 2 ? history[history.length - 2]! : null;

  const metrics: GrowthMetric[] = [];

  // Revenue / EPS / dividend year-on-year.
  metrics.push(
    metric(
      'revenueGrowth',
      'Revenue growth (YoY)',
      prior ? yoy(new Decimal(latest.revenue), new Decimal(prior.revenue)) : null,
      'Revenue fell year-on-year.',
    ),
  );
  metrics.push(
    metric(
      'epsGrowth',
      'EPS growth (YoY)',
      prior ? yoy(eps(latest), eps(prior)) : null,
      'Earnings per share fell year-on-year.',
    ),
  );
  metrics.push(
    metric(
      'dividendGrowth',
      'Dividend growth (YoY)',
      prior
        ? yoy(new Decimal(latest.dividendPerShare), new Decimal(prior.dividendPerShare))
        : null,
      'Dividend per share fell year-on-year.',
    ),
  );

  // Return on equity (current period; needs positive equity).
  const equity = new Decimal(latest.totalEquity);
  const roe = equity.gt(0) ? pct(new Decimal(latest.netIncome).div(equity).times(100)) : null;
  metrics.push({
    key: 'roe',
    label: 'Return on equity',
    value: roe,
    display: roe == null ? '—' : `${roe.toFixed(2)}%`,
    note:
      roe == null && equity.lte(0)
        ? 'Return on equity is not meaningful with non-positive equity.'
        : undefined,
  });

  // Revenue 3-year CAGR (needs ≥4 periods, positive base).
  let revenueCagr: number | null = null;
  if (history.length >= 4) {
    const base = new Decimal(history[history.length - 4]!.revenue);
    const end = new Decimal(latest.revenue);
    if (base.gt(0)) {
      const ratio = end.div(base).toNumber();
      revenueCagr = pct(new Decimal(Math.pow(ratio, 1 / 3) - 1).times(100));
    }
  }
  metrics.push(
    metric('revenueCagr3y', 'Revenue 3-yr CAGR', revenueCagr, 'Revenue contracted over three years.'),
  );

  return {
    ticker: latest.ticker,
    latestPeriod: latest.period,
    priorPeriod: prior?.period ?? null,
    periods: history.length,
    metrics,
  };
}
