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
