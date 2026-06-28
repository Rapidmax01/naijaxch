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

/**
 * Wilder's Relative Strength Index (0–100). Null until `period` changes exist.
 */
export function rsi(values: number[], period = 14): (number | null)[] {
  if (period <= 0) throw new Error('RSI period must be positive');
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;

  const rsiFrom = (avgGain: Decimal, avgLoss: Decimal): number => {
    if (avgLoss.isZero()) return avgGain.isZero() ? 50 : 100;
    const rs = avgGain.div(avgLoss);
    return new Decimal(100)
      .minus(new Decimal(100).div(rs.plus(1)))
      .toDecimalPlaces(2)
      .toNumber();
  };

  let avgGain = new Decimal(0);
  let avgLoss = new Decimal(0);
  for (let i = 1; i <= period; i++) {
    const diff = new Decimal(values[i]!).minus(values[i - 1]!);
    if (diff.gt(0)) avgGain = avgGain.plus(diff);
    else avgLoss = avgLoss.plus(diff.abs());
  }
  avgGain = avgGain.div(period);
  avgLoss = avgLoss.div(period);
  out[period] = rsiFrom(avgGain, avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const diff = new Decimal(values[i]!).minus(values[i - 1]!);
    const gain = diff.gt(0) ? diff : new Decimal(0);
    const loss = diff.lt(0) ? diff.abs() : new Decimal(0);
    avgGain = avgGain.times(period - 1).plus(gain).div(period);
    avgLoss = avgLoss.times(period - 1).plus(loss).div(period);
    out[i] = rsiFrom(avgGain, avgLoss);
  }
  return out;
}

export interface Macd {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

/** MACD line (fast EMA − slow EMA), signal (EMA of MACD), and the histogram. */
export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9): Macd {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);

  const macdLine: (number | null)[] = values.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null
      ? new Decimal(emaFast[i]!).minus(emaSlow[i]!).toDecimalPlaces(4).toNumber()
      : null,
  );

  // Signal = EMA of the defined MACD values, mapped back to their indices.
  const definedIdx: number[] = [];
  const definedVals: number[] = [];
  macdLine.forEach((v, i) => {
    if (v != null) {
      definedIdx.push(i);
      definedVals.push(v);
    }
  });
  const sigVals = ema(definedVals, signalPeriod);
  const signal: (number | null)[] = new Array(values.length).fill(null);
  definedIdx.forEach((idx, k) => {
    signal[idx] = sigVals[k] ?? null;
  });

  const histogram: (number | null)[] = values.map((_, i) =>
    macdLine[i] != null && signal[i] != null
      ? new Decimal(macdLine[i]!).minus(signal[i]!).toDecimalPlaces(4).toNumber()
      : null,
  );

  return { macd: macdLine, signal, histogram };
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
