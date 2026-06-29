/**
 * Valuation-context service: pairs each fiscal period's EPS with the adjusted
 * price at that period's end, then asks the rules engine for the current P/E vs
 * its multi-year average (proposal 0006 Phase B). All numbers computed (G1),
 * general information (G2). Does NOT feed AI summaries (gate #4 unchanged).
 */

import Decimal from 'decimal.js';
import { dataStore } from '@/data';
import { peHistory, type PeHistory, type PeInput } from '@/rules';
import { priceOnOrBefore, type PriceSeries } from '@/series';
import { getAdjustedSeries } from './series';
import type { Fundamentals, Ticker } from '@/data/types';

/** EPS for a period (null when shares are zero/missing). */
function eps(f: Fundamentals): number | null {
  return f.shareCount > 0 ? new Decimal(f.netIncome).div(f.shareCount).toDecimalPlaces(4).toNumber() : null;
}

/** Fiscal-year-end ISO date from an `FY####` period label (assumes Dec 31). */
function fiscalYearEnd(period: string): string | null {
  const m = /FY(\d{4})/.exec(period);
  return m ? `${m[1]}-12-31` : null;
}

/**
 * Pure assembly: pair each period's EPS with the adjusted price at its
 * fiscal-year-end, plus the current P/E, then defer to the rules engine. Kept
 * separate from data loading so it is testable without a store/DB.
 */
export function peHistoryFrom(history: Fundamentals[], series: PriceSeries): PeHistory | null {
  if (series.points.length === 0 || history.length === 0) return null;

  const inputs: PeInput[] = history.map((f) => {
    const end = fiscalYearEnd(f.period);
    return {
      period: f.period,
      eps: eps(f),
      price: end ? priceOnOrBefore(series, end) : null,
    };
  });

  // Current P/E: latest adjusted close ÷ latest EPS (matches the report card).
  const latest = history[history.length - 1]!;
  const latestEps = eps(latest);
  const currentPrice = series.points[series.points.length - 1]!.adjClose;
  const currentPe =
    latestEps != null && latestEps > 0
      ? new Decimal(currentPrice).div(latestEps).toDecimalPlaces(2).toNumber()
      : null;

  return peHistory(inputs, currentPe);
}

export async function getPeHistory(ticker: Ticker): Promise<PeHistory | null> {
  const [history, series] = await Promise.all([
    dataStore.getFundamentalsHistory(ticker),
    getAdjustedSeries(ticker),
  ]);
  if (!series) return null;
  return peHistoryFrom(history, series);
}
