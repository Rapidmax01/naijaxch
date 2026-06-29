/**
 * Sector-comparison helpers. Pure, deterministic (G1). These compare an
 * already-computed metric to its sector peers — general information (G2: "yield
 * above the sector median"), never advice. No figure is produced here beyond
 * the median of values handed in.
 */

/** Median of finite values, or null when there are none. */
export function median(values: number[]): number | null {
  const xs = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 === 1 ? xs[mid]! : (xs[mid - 1]! + xs[mid]!) / 2;
}

export type SectorPosition = 'above' | 'below' | 'inline';

/**
 * Where `value` sits relative to a sector `med`. Values within `epsilonPct`
 * percent of the median are reported as "inline" so tiny gaps aren't dressed up
 * as differences. Returns null when either side is missing.
 */
export function sectorPosition(
  value: number | null,
  med: number | null,
  epsilonPct = 2,
): SectorPosition | null {
  if (value == null || med == null) return null;
  if (med === 0) return value > 0 ? 'above' : value < 0 ? 'below' : 'inline';
  const diffPct = ((value - med) / Math.abs(med)) * 100;
  if (Math.abs(diffPct) <= epsilonPct) return 'inline';
  return diffPct > 0 ? 'above' : 'below';
}
