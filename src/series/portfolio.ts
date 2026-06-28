/**
 * Portfolio-level trend (spec §5.5, TS) — same engine, second surface.
 *
 * Sum each holding's quantity × adjClose per day into a portfolio time-series,
 * rendered with the same scrubbable chart component. EOD data, decimal math.
 *
 * Alignment: the portfolio series starts on the latest "first date" across all
 * holdings (so every holding has data from day one) and forward-fills each
 * holding's last known adjClose on days it didn't trade.
 */

import Decimal from 'decimal.js';
import type { Ticker } from '@/data/types';
import type { PriceSeries } from './types';

export interface Holding {
  ticker: Ticker;
  /** Units held (manual entry — no fractional NGX shares, but kept general). */
  quantity: number;
}

const PORTFOLIO_TICKER = 'PORTFOLIO';

/** adjClose lookup per ticker: most recent value on or before a given date. */
function makeForwardFill(series: PriceSeries) {
  const pts = series.points; // ascending by date
  return (date: string): Decimal | null => {
    let value: Decimal | null = null;
    for (const p of pts) {
      if (p.date <= date) value = new Decimal(p.adjClose);
      else break;
    }
    return value;
  };
}

/**
 * Build the portfolio's adjusted series. Returns an empty series if any holding
 * lacks price data or there is no common date range.
 */
export function buildPortfolioSeries(
  holdings: Holding[],
  seriesByTicker: Map<Ticker, PriceSeries>,
): PriceSeries {
  const empty: PriceSeries = { ticker: PORTFOLIO_TICKER, points: [] };
  if (holdings.length === 0) return empty;

  const lookups = new Map<Ticker, (date: string) => Decimal | null>();
  const firstDates: string[] = [];
  const allDates = new Set<string>();

  for (const h of holdings) {
    const s = seriesByTicker.get(h.ticker);
    if (!s || s.points.length === 0) return empty; // missing data → can't value portfolio
    lookups.set(h.ticker, makeForwardFill(s));
    firstDates.push(s.points[0]!.date);
    for (const p of s.points) allDates.add(p.date);
  }

  // Start where every holding has data.
  const startDate = firstDates.reduce((max, d) => (d > max ? d : max));
  const dates = [...allDates].filter((d) => d >= startDate).sort((a, b) => a.localeCompare(b));

  const points = dates.map((date) => {
    let total = new Decimal(0);
    for (const h of holdings) {
      const adj = lookups.get(h.ticker)!(date);
      if (adj != null) total = total.plus(adj.times(h.quantity));
    }
    const value = total.toDecimalPlaces(2).toNumber();
    return {
      ticker: PORTFOLIO_TICKER,
      date,
      close: value, // for a portfolio, raw == adjusted (already built from adjClose)
      adjClose: value,
      volume: 0,
      adjFactor: 1,
    };
  });

  return { ticker: PORTFOLIO_TICKER, points };
}
