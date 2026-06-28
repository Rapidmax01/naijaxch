/**
 * Pure validation + de-duplication of provider rows before they hit the DB.
 * No I/O — fully unit-testable. Bad rows are dropped (not guessed at) so we
 * never write a corrupt close that would corrupt a chart (G1/G6).
 */

import type { CorporateAction, Fundamentals, RawPricePoint } from '@/data/types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(date: string): boolean {
  if (!ISO_DATE.test(date)) return false;
  const t = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(t);
}

/** A price row is valid when its date is ISO, close is finite & > 0, volume ≥ 0. */
export function isValidPrice(p: RawPricePoint): boolean {
  return (
    isValidDate(p.date) &&
    Number.isFinite(p.close) &&
    p.close > 0 &&
    Number.isFinite(p.volume) &&
    p.volume >= 0
  );
}

/** Drop invalid rows and collapse duplicate dates (last value wins). */
export function cleanPrices(points: RawPricePoint[]): RawPricePoint[] {
  const byDate = new Map<string, RawPricePoint>();
  for (const p of points) {
    if (isValidPrice(p)) byDate.set(p.date, p);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

const ACTION_TYPES = new Set(['bonus', 'split', 'rights']);

export function isValidAction(a: CorporateAction): boolean {
  return isValidDate(a.exDate) && ACTION_TYPES.has(a.type) && a.terms != null;
}

/** Drop invalid actions and de-duplicate on (ticker, exDate, type). */
export function cleanActions(actions: CorporateAction[]): CorporateAction[] {
  const seen = new Map<string, CorporateAction>();
  for (const a of actions) {
    if (!isValidAction(a)) continue;
    seen.set(`${a.ticker}|${a.exDate}|${a.type}`, a);
  }
  return [...seen.values()];
}

export function isValidFundamentals(f: Fundamentals): boolean {
  return (
    typeof f.period === 'string' &&
    f.period.length > 0 &&
    Number.isFinite(f.revenue) &&
    Number.isFinite(f.netIncome) &&
    Number.isFinite(f.shareCount) &&
    f.shareCount >= 0
  );
}

/** Drop invalid fundamentals and de-duplicate on (ticker, period). */
export function cleanFundamentals(rows: Fundamentals[]): Fundamentals[] {
  const seen = new Map<string, Fundamentals>();
  for (const f of rows) {
    if (isValidFundamentals(f)) seen.set(`${f.ticker}|${f.period}`, f);
  }
  return [...seen.values()];
}
