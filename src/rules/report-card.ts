/**
 * Deterministic rules engine (spec §6.1). Pure functions: raw fundamentals +
 * current price → metrics with neutral, general-information status notes.
 *
 * GUARDRAIL G1: every number here is COMPUTED (decimal.js), never produced by
 * an LLM. GUARDRAIL G2: notes are general information ("the data shows…"),
 * never advice ("you should…"). All public values are rounded for display (TS3).
 */

import Decimal from 'decimal.js';
import type { Fundamentals } from '@/data/types';

/** good = healthy reading · neutral = informational · watch = notable risk signal. */
export type MetricStatus = 'good' | 'neutral' | 'watch';

export interface Metric {
  key: string;
  label: string;
  /** Rounded numeric value, or null when not computable (e.g. EPS with no shares). */
  value: number | null;
  /** Pre-formatted display string (already rounded — TS3). */
  display: string;
  unit: 'naira' | 'ratio' | 'percent' | 'x';
  status: MetricStatus;
  /** Neutral, general-information note (G2). Present on notable readings. */
  note?: string;
}

export interface ReportCard {
  ticker: string;
  period: string;
  currentPrice: number;
  metrics: Metric[];
  /** Notes from every `watch` metric, surfaced as headline flags. */
  flags: string[];
}

function round(d: Decimal, dp = 2): number {
  return d.toDecimalPlaces(dp).toNumber();
}

function naira(d: Decimal): string {
  const v = round(d);
  return `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Compute the report card. `currentPrice` is the latest adjusted close, passed
 * in by the caller (the engine never re-fetches — layering rule).
 */
export function computeReportCard(f: Fundamentals, currentPrice: number): ReportCard {
  const price = new Decimal(currentPrice);
  const shares = new Decimal(f.shareCount);
  const netIncome = new Decimal(f.netIncome);
  const revenue = new Decimal(f.revenue);
  const dps = new Decimal(f.dividendPerShare);
  const equity = new Decimal(f.totalEquity);
  const debt = new Decimal(f.totalDebt);

  const metrics: Metric[] = [];

  // EPS = net income / shares
  const eps = shares.isZero() ? null : netIncome.div(shares);
  metrics.push({
    key: 'eps',
    label: 'Earnings per share',
    value: eps ? round(eps) : null,
    display: eps ? naira(eps) : '—',
    unit: 'naira',
    status: eps && eps.gt(0) ? 'good' : 'watch',
    note: eps && !eps.gt(0) ? 'The company reported a loss for this period.' : undefined,
  });

  // P/E = price / EPS (only meaningful with positive earnings)
  const pe = eps && eps.gt(0) ? price.div(eps) : null;
  metrics.push({
    key: 'pe',
    label: 'Price / earnings',
    value: pe ? round(pe) : null,
    display: pe ? `${round(pe)}x` : '—',
    unit: 'x',
    status: 'neutral',
    note: pe ? undefined : 'No positive earnings to value against this period.',
  });

  // Dividend cover = EPS / DPS
  const cover = eps && dps.gt(0) ? eps.div(dps) : null;
  metrics.push({
    key: 'dividendCover',
    label: 'Dividend cover',
    value: cover ? round(cover) : null,
    display: cover ? `${round(cover)}x` : dps.isZero() ? 'No dividend' : '—',
    unit: 'x',
    status: cover ? (cover.gte(2) ? 'good' : cover.gte(1) ? 'neutral' : 'watch') : 'neutral',
    note:
      cover && cover.lt(1)
        ? 'Dividend cover is below 1 — the declared dividend exceeded earnings this period.'
        : undefined,
  });

  // Dividend yield = DPS / price * 100
  const yieldPct = price.gt(0) ? dps.div(price).times(100) : null;
  metrics.push({
    key: 'dividendYield',
    label: 'Dividend yield',
    value: yieldPct ? round(yieldPct) : null,
    display: yieldPct ? `${round(yieldPct)}%` : '—',
    unit: 'percent',
    status: 'neutral',
  });

  // Net margin = net income / revenue * 100
  const margin = revenue.gt(0) ? netIncome.div(revenue).times(100) : null;
  metrics.push({
    key: 'netMargin',
    label: 'Net margin',
    value: margin ? round(margin) : null,
    display: margin ? `${round(margin)}%` : '—',
    unit: 'percent',
    status: margin ? (margin.gt(15) ? 'good' : margin.gt(0) ? 'neutral' : 'watch') : 'neutral',
    note: margin && margin.lte(0) ? 'The company was unprofitable on net margin this period.' : undefined,
  });

  // Debt / equity
  const de = equity.gt(0) ? debt.div(equity) : null;
  metrics.push({
    key: 'debtToEquity',
    label: 'Debt / equity',
    value: de ? round(de) : null,
    display: de ? `${round(de)}x` : equity.lte(0) ? 'Negative equity' : '—',
    unit: 'x',
    status: de ? (de.lt(1) ? 'good' : de.lt(2) ? 'neutral' : 'watch') : 'watch',
    note: !de && equity.lte(0)
      ? 'Shareholder equity is negative — liabilities exceed assets.'
      : de && de.gte(2)
        ? 'Debt is more than twice shareholder equity.'
        : undefined,
  });

  const flags = metrics.filter((m) => m.status === 'watch' && m.note).map((m) => m.note!);

  return {
    ticker: f.ticker,
    period: f.period,
    currentPrice: round(price),
    metrics,
    flags,
  };
}
