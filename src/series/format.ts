/**
 * Display formatting — number hygiene (TS3 / spec §5.4).
 * Every price/percent shown to a user is rounded: ₦ to 2 dp, % to 2 dp.
 * No float artifacts ever reach the screen.
 */

import Decimal from 'decimal.js';

/** Format a Naira value, e.g. `12345.6` → `₦12,345.60`. */
export function formatNaira(value: number): string {
  const d = new Decimal(value).toDecimalPlaces(2);
  const [intPart, fracPart = '00'] = d.toFixed(2).split('.');
  const sign = intPart!.startsWith('-') ? '-' : '';
  const digits = intPart!.replace('-', '');
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}₦${grouped}.${fracPart}`;
}

/** Format a percent with sign, e.g. `4.2` → `+4.20%`, `-1` → `-1.00%`. */
export function formatPct(value: number): string {
  const d = new Decimal(value).toDecimalPlaces(2);
  const sign = d.greaterThanOrEqualTo(0) ? '+' : '';
  return `${sign}${d.toFixed(2)}%`;
}

/** Compact integer (volume), e.g. `250000` → `250K`, `1500000` → `1.5M`. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${Math.round(value / 1e3)}K`;
  return String(Math.round(value));
}

/** Format an ISO date `YYYY-MM-DD` → `DD Mon YYYY` (e.g. `15 Mar 2024`). */
export function formatDate(iso: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m, d] = iso.split('-');
  const mi = Number(m) - 1;
  if (!y || mi < 0 || mi > 11 || !d) return iso;
  return `${d} ${months[mi]} ${y}`;
}
