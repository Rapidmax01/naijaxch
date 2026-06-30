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

/** A disclosure with its company name, for the homepage cross-company feed. */
export interface NewsFeedItem extends Disclosure {
  companyName: string;
}

/** Latest disclosures across the NGX, newest first, with company names attached. */
export async function getNewsFeed(limit = 10): Promise<NewsFeedItem[]> {
  const [disclosures, companies] = await Promise.all([
    dataStore.getLatestDisclosures(limit),
    dataStore.listCompanies(),
  ]);
  const nameByTicker = new Map(companies.map((c) => [c.ticker, c.name]));
  return disclosures.map((d) => ({ ...d, companyName: nameByTicker.get(d.ticker) ?? d.ticker }));
}
