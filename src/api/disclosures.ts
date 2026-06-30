/**
 * Disclosures service (proposal 0009) — official NGX company filings for a
 * company page. Reads stored items from the source of truth (layering rule); it
 * derives no figures (G1) and never feeds the AI grounding (#4). Qualitative
 * context shown alongside — never mixed into — the computed panels.
 */

import { dataStore, type Disclosure, type Ticker } from '@/data';

export async function getDisclosures(ticker: Ticker): Promise<Disclosure[]> {
  return dataStore.getDisclosures(ticker);
}
