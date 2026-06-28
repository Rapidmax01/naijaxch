/**
 * src/data — single source of truth domain types.
 *
 * Raw, un-derived facts: closing prices as reported by NGX, and the corporate
 * actions that the trend engine (src/series) consumes to build the adjusted
 * series. Nothing here is computed — derived values live in src/series.
 */

export type Ticker = string;

/** One trading day's raw (unadjusted) close for an NGX equity. */
export interface RawPricePoint {
  ticker: Ticker;
  /** ISO trading day, `YYYY-MM-DD`. */
  date: string;
  /** Unadjusted closing price in Naira (kept for reference/audit — never plotted). */
  close: number;
  /** Day volume (used for the "thinly traded" hint). */
  volume: number;
}

/**
 * Raw, as-reported financial statement figures for one reporting period.
 * These are inputs only — every ratio/score is COMPUTED by the rules engine
 * (src/rules), never stored pre-derived and never produced by an LLM (G1).
 * Monetary figures are in Naira.
 */
export interface Fundamentals {
  ticker: Ticker;
  /** Reporting period label, e.g. `FY2023`. */
  period: string;
  revenue: number;
  netIncome: number;
  /** Shares outstanding (count). */
  shareCount: number;
  /** Dividend per share declared for the period (₦). */
  dividendPerShare: number;
  totalEquity: number;
  totalDebt: number;
}

export type CorporateActionType = 'bonus' | 'split' | 'rights';

/** Bonus or split: `newShares` new per `perHeld` held (N new per M held). */
export interface BonusOrSplitTerms {
  newShares: number; // N
  perHeld: number; // M
}

/**
 * Rights issue — the error-prone case (see trend-engine rules).
 * `cumPrice` is the cum-rights reference price (typically the last close before
 * the ex-date); `subscriptionPrice` is the price to subscribe each new share.
 */
export interface RightsTerms {
  newShares: number; // N new...
  perHeld: number; // ...per M held
  subscriptionPrice: number; // Naira per new share
  cumPrice: number; // cum-rights reference price (Naira)
}

export type CorporateActionTerms = BonusOrSplitTerms | RightsTerms;

/**
 * A corporate action with an ex-date. The adjustment applies to every trading
 * day strictly BEFORE `exDate` (see back-adjustment algorithm in src/series).
 */
export interface CorporateAction {
  ticker: Ticker;
  /** ISO `YYYY-MM-DD`. */
  exDate: string;
  type: CorporateActionType;
  terms: CorporateActionTerms;
}
