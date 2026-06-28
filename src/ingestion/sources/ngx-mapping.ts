/**
 * Pure mappers: NGX API JSON → our domain types. No I/O — unit-tested.
 *
 * ⚠️ The field names below mirror an ASSUMED NGX delayed/EOD JSON shape. NGX's
 * market-data API is licensed and quote-based (spec §8); confirm the real
 * endpoints + field names against NGX's API docs once licensed, and adjust the
 * `pick`/field reads here. The mapping is isolated precisely so that's a small,
 * localized change. Bad rows map to values the validate/clean layer drops.
 */

import type {
  Company,
  CorporateAction,
  CorporateActionType,
  Fundamentals,
  RawPricePoint,
  Ticker,
} from '@/data/types';

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(/,/g, ''));
  return NaN;
}

/** Normalize a date-ish value to ISO `YYYY-MM-DD` (NGX may send a datetime). */
function isoDate(v: unknown): string {
  return typeof v === 'string' ? v.slice(0, 10) : '';
}

export interface NgxEquity {
  symbol?: string;
  name?: string;
  sector?: string;
  sharesOutstanding?: number | string;
}

export function mapCompany(raw: NgxEquity): Company {
  const ticker = String(raw.symbol ?? '').trim().toUpperCase();
  return {
    ticker,
    name: String(raw.name ?? ticker).trim(),
    sector: String(raw.sector ?? 'Unclassified').trim(),
    sharesOutstanding: raw.sharesOutstanding != null ? num(raw.sharesOutstanding) : undefined,
  };
}

export interface NgxPrice {
  date?: string;
  close?: number | string;
  volume?: number | string;
}

export function mapPrice(ticker: Ticker, raw: NgxPrice): RawPricePoint {
  return {
    ticker,
    date: isoDate(raw.date),
    close: num(raw.close),
    volume: Math.trunc(num(raw.volume)),
  };
}

const ACTION_TYPES: Record<string, CorporateActionType> = {
  bonus: 'bonus',
  split: 'split',
  rights: 'rights',
};

export interface NgxAction {
  exDate?: string;
  type?: string;
  /** N new per M held. */
  newShares?: number | string;
  perHeld?: number | string;
  /** rights only */
  subscriptionPrice?: number | string;
  cumPrice?: number | string;
}

/** Returns null for unknown action types (filtered out, never guessed). */
export function mapAction(ticker: Ticker, raw: NgxAction): CorporateAction | null {
  const type = ACTION_TYPES[String(raw.type ?? '').toLowerCase()];
  if (!type) return null;

  const newShares = num(raw.newShares);
  const perHeld = num(raw.perHeld);

  if (type === 'rights') {
    return {
      ticker,
      exDate: isoDate(raw.exDate),
      type,
      terms: {
        newShares,
        perHeld,
        subscriptionPrice: num(raw.subscriptionPrice),
        cumPrice: num(raw.cumPrice),
      },
    };
  }
  return { ticker, exDate: isoDate(raw.exDate), type, terms: { newShares, perHeld } };
}

export interface NgxFinancials {
  period?: string;
  revenue?: number | string;
  netIncome?: number | string;
  shareCount?: number | string;
  dividendPerShare?: number | string;
  totalEquity?: number | string;
  totalDebt?: number | string;
}

export function mapFundamentals(ticker: Ticker, raw: NgxFinancials): Fundamentals {
  return {
    ticker,
    period: String(raw.period ?? '').trim(),
    revenue: num(raw.revenue),
    netIncome: num(raw.netIncome),
    shareCount: num(raw.shareCount),
    dividendPerShare: num(raw.dividendPerShare),
    totalEquity: num(raw.totalEquity),
    totalDebt: num(raw.totalDebt),
  };
}
