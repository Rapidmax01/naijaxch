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

/** Format an ISO date `YYYY-MM-DD` → `DD Mon YYYY` (e.g. `15 Mar 2024`). */
export function formatDate(iso: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m, d] = iso.split('-');
  const mi = Number(m) - 1;
  if (!y || mi < 0 || mi > 11 || !d) return iso;
  return `${d} ${months[mi]} ${y}`;
}
