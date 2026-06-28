/**
 * Technical indicators over the adjusted series. Deterministic math (decimal.js)
 * — never an LLM (G1). Values are rounded for display (TS3). Computed on the
 * full series and sliced to the chart window so trailing averages are correct.
 */

import Decimal from 'decimal.js';

/**
 * Simple moving average aligned to the input array. Each element is the mean of
 * the trailing `period` values, or null until there are enough points.
 */
export function sma(values: number[], period: number): (number | null)[] {
  if (period <= 0) throw new Error('SMA period must be positive');
  const out: (number | null)[] = [];
  let windowSum = new Decimal(0);
  for (let i = 0; i < values.length; i++) {
    windowSum = windowSum.plus(values[i]!);
    if (i >= period) windowSum = windowSum.minus(values[i - period]!);
    out.push(i >= period - 1 ? windowSum.div(period).toDecimalPlaces(4).toNumber() : null);
  }
  return out;
}

/**
 * Exponential moving average. Seeded with the SMA of the first `period` values,
 * then `ema = (price - prevEma) * k + prevEma` with `k = 2 / (period + 1)`.
 * Null until the seed point.
 */
export function ema(values: number[], period: number): (number | null)[] {
  if (period <= 0) throw new Error('EMA period must be positive');
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;

  const k = new Decimal(2).div(period + 1);
  let prev = new Decimal(0);
  for (let i = 0; i < period; i++) prev = prev.plus(values[i]!);
  prev = prev.div(period);
  out[period - 1] = prev.toDecimalPlaces(4).toNumber();

  for (let i = period; i < values.length; i++) {
    prev = new Decimal(values[i]!).minus(prev).times(k).plus(prev);
    out[i] = prev.toDecimalPlaces(4).toNumber();
  }
  return out;
}

export interface BollingerBands {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
}

/**
 * Bollinger Bands: a `period` SMA (middle) with upper/lower bands at ±`mult`
 * population standard deviations. Null until the period is reached.
 */
export function bollinger(values: number[], period: number, mult = 2): BollingerBands {
  if (period <= 0) throw new Error('Bollinger period must be positive');
  const middle: (number | null)[] = [];
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      middle.push(null);
      upper.push(null);
      lower.push(null);
      continue;
    }
    let sum = new Decimal(0);
    for (let j = i - period + 1; j <= i; j++) sum = sum.plus(values[j]!);
    const mean = sum.div(period);

    let varSum = new Decimal(0);
    for (let j = i - period + 1; j <= i; j++) {
      const diff = new Decimal(values[j]!).minus(mean);
      varSum = varSum.plus(diff.times(diff));
    }
    const std = varSum.div(period).sqrt();

    middle.push(mean.toDecimalPlaces(4).toNumber());
    upper.push(mean.plus(std.times(mult)).toDecimalPlaces(4).toNumber());
    lower.push(mean.minus(std.times(mult)).toDecimalPlaces(4).toNumber());
  }
  return { middle, upper, lower };
}
