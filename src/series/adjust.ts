/**
 * Corporate-action back-adjustment — the hidden quality bar (spec §5.3, TS).
 *
 * Plotting raw prices makes every bonus/rights ex-date look like a crash. We
 * back-adjust so the multi-period chart tells the truth. All arithmetic uses
 * decimal.js — NEVER native float math for prices/factors (project convention).
 *
 * GUARDRAIL: changes to this logic require human approval (CLAUDE.md). A wrong
 * factor silently corrupts every chart. Every factor is unit-tested against a
 * known-good fixture before it powers a chart.
 */

import Decimal from 'decimal.js';
import type {
  BonusOrSplitTerms,
  CorporateAction,
  RawPricePoint,
  RightsTerms,
} from '@/data/types';
import type { PricePoint, PriceSeries } from './types';

/** Internal adjusted-close precision before display rounding. */
const ADJ_CLOSE_DP = 4;

/**
 * Bonus / split factor: N new shares per M held → `M / (M + N)`.
 * A 1-for-4 bonus (N=1, M=4) gives 4/5 = 0.8.
 */
export function bonusSplitFactor(terms: BonusOrSplitTerms): Decimal {
  const M = new Decimal(terms.perHeld);
  const N = new Decimal(terms.newShares);
  const denom = M.plus(N);
  if (denom.isZero()) throw new Error('Invalid bonus/split terms: perHeld + newShares = 0');
  return M.div(denom);
}

/**
 * Theoretical ex-rights price (TERP):
 *   TERP = (M * cumPrice + N * subscriptionPrice) / (M + N)
 */
export function terp(terms: RightsTerms): Decimal {
  const M = new Decimal(terms.perHeld);
  const N = new Decimal(terms.newShares);
  const cum = new Decimal(terms.cumPrice);
  const sub = new Decimal(terms.subscriptionPrice);
  const denom = M.plus(N);
  if (denom.isZero()) throw new Error('Invalid rights terms: perHeld + newShares = 0');
  return M.times(cum).plus(N.times(sub)).div(denom);
}

/** Rights factor: `TERP / cumPrice`. The error-prone case — tested explicitly. */
export function rightsFactor(terms: RightsTerms): Decimal {
  const cum = new Decimal(terms.cumPrice);
  if (cum.isZero()) throw new Error('Invalid rights terms: cumPrice = 0');
  return terp(terms).div(cum);
}

/** Per-action adjustment factor (≤ 1 for bonus/split/rights). */
export function actionFactor(action: CorporateAction): Decimal {
  switch (action.type) {
    case 'bonus':
    case 'split':
      return bonusSplitFactor(action.terms as BonusOrSplitTerms);
    case 'rights':
      return rightsFactor(action.terms as RightsTerms);
    default: {
      const exhaustive: never = action.type;
      throw new Error(`Unknown corporate action type: ${String(exhaustive)}`);
    }
  }
}

/**
 * Build the adjusted EOD series from raw closes + corporate actions.
 *
 * For each trading day, `adjFactor` = product of every action factor whose
 * `exDate` is strictly AFTER that day; `adjClose = close * adjFactor`.
 * ISO `YYYY-MM-DD` strings sort lexicographically == chronologically.
 */
export function buildAdjustedSeries(
  raw: RawPricePoint[],
  actions: CorporateAction[],
): PriceSeries {
  if (raw.length === 0) return { ticker: '', points: [] };

  const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
  const ticker = sorted[0]!.ticker;

  const factored = actions.map((a) => ({ exDate: a.exDate, factor: actionFactor(a) }));

  const adj = (value: number, f: Decimal) =>
    new Decimal(value).times(f).toDecimalPlaces(ADJ_CLOSE_DP).toNumber();

  const points: PricePoint[] = sorted.map((p) => {
    let f = new Decimal(1);
    for (const a of factored) {
      if (a.exDate > p.date) f = f.times(a.factor);
    }
    // The same cumulative factor adjusts every price field (open/high/low/close)
    // so the candlestick view is continuous across ex-dates, like the line (G6).
    return {
      ticker: p.ticker,
      date: p.date,
      close: p.close,
      volume: p.volume,
      adjFactor: f.toNumber(),
      adjClose: adj(p.close, f),
      adjOpen: adj(p.open, f),
      adjHigh: adj(p.high, f),
      adjLow: adj(p.low, f),
    };
  });

  return { ticker, points };
}
