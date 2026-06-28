/**
 * NGX market-data source — the real adapter behind MarketDataSource.
 *
 * GUARDRAIL G3: displaying NGX data requires an NGX distribution licence;
 * Phase 1 uses the DELAYED / END-OF-DAY tier only. This adapter refuses to run
 * against a real-time tier (constructor throws) — a real-time/tick feed is a
 * separate paid licence and needs explicit human approval (CLAUDE.md #6).
 *
 * Activation is config-gated: used only when NGX_DATA_API_BASE + NGX_DATA_API_KEY
 * are set (see selectMarketDataSource). Endpoints/fields below assume a typical
 * REST shape — confirm them against NGX's real API docs once licensed; the
 * response→domain mapping is isolated in ngx-mapping.ts so that's a small change.
 */

import type { Company, CorporateAction, Fundamentals, RawPricePoint, Ticker } from '@/data/types';
import type { MarketDataSource } from './types';
import {
  mapAction,
  mapCompany,
  mapFundamentals,
  mapPrice,
  type NgxAction,
  type NgxEquity,
  type NgxFinancials,
  type NgxPrice,
} from './ngx-mapping';

/** Allowed (licensed Phase-1) data tiers. Real-time is explicitly excluded. */
const ALLOWED_TIERS = new Set(['eod', 'delayed']);

export function ngxSourceConfigured(): boolean {
  return Boolean(process.env.NGX_DATA_API_BASE && process.env.NGX_DATA_API_KEY);
}

export class NgxMarketDataSource implements MarketDataSource {
  private readonly base: string;
  private readonly apiKey: string;

  constructor() {
    const base = process.env.NGX_DATA_API_BASE;
    const apiKey = process.env.NGX_DATA_API_KEY;
    if (!base || !apiKey) {
      throw new Error('NGX_DATA_API_BASE and NGX_DATA_API_KEY are required.');
    }

    // G3: refuse anything but the licensed delayed/EOD tiers.
    const tier = (process.env.NGX_DATA_TIER ?? 'eod').toLowerCase();
    if (!ALLOWED_TIERS.has(tier)) {
      throw new Error(
        `NGX_DATA_TIER="${tier}" is not allowed. Phase 1 is delayed/EOD only; a real-time feed is a separate licence requiring human approval (G3).`,
      );
    }

    this.base = base.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`NGX API ${path} failed: ${res.status}`);
    }
    return (await res.json()) as T;
  }

  async listCompanies(): Promise<Company[]> {
    const data = await this.get<NgxEquity[]>('/equities');
    return data.map(mapCompany).filter((c) => c.ticker.length > 0);
  }

  async fetchDailyCloses(ticker: Ticker): Promise<RawPricePoint[]> {
    // Delayed/EOD daily series for the ticker.
    const data = await this.get<NgxPrice[]>(
      `/equities/${encodeURIComponent(ticker)}/prices?interval=eod`,
    );
    return data.map((p) => mapPrice(ticker, p));
  }

  async fetchCorporateActions(ticker: Ticker): Promise<CorporateAction[]> {
    const data = await this.get<NgxAction[]>(
      `/equities/${encodeURIComponent(ticker)}/corporate-actions`,
    );
    return data
      .map((a) => mapAction(ticker, a))
      .filter((a): a is CorporateAction => a !== null);
  }

  async fetchFundamentals(ticker: Ticker): Promise<Fundamentals[]> {
    const data = await this.get<NgxFinancials[]>(
      `/equities/${encodeURIComponent(ticker)}/financials`,
    );
    return data.map((f) => mapFundamentals(ticker, f));
  }
}
