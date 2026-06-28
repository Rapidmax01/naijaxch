/**
 * Sector colour-coding. A distinct, harmonious hue per NGX sector — used for
 * dots/chips/accents across the markets list, stock page, screener, and heatmap
 * so the universe is scannable by sector. Pure (no React); unit-tested.
 */

const SECTOR_COLORS: Record<string, string> = {
  'Financial Services': '#3b5bdb', // indigo
  'Industrial Goods': '#9c6b1f', // bronze
  'Consumer Goods': '#c2255c', // rose
  Telecoms: '#6741d9', // violet
  'Oil & Gas': '#0b7285', // deep teal
  Insurance: '#1098ad', // cyan
  Agriculture: '#2f9e44', // green
  Conglomerates: '#5f3dc4', // grape
  Construction: '#d9480f', // burnt orange
  Services: '#9c36b5', // purple
  'Real Estate': '#846358', // taupe
  ICT: '#1971c2', // sky
  Healthcare: '#0ca678', // teal-green
};

const DEFAULT_COLOR = '#6b6f76';

/** Brand-ish hue for a sector (falls back to a neutral grey). */
export function sectorColor(sector: string): string {
  return SECTOR_COLORS[sector] ?? DEFAULT_COLOR;
}

/** A very light wash of the sector colour for chip backgrounds. */
export function sectorWash(sector: string): string {
  return `${sectorColor(sector)}1a`; // hex + ~10% alpha
}
