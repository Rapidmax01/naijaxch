/**
 * PostgreSQL + TimescaleDB implementation of SourceOfTruth (Prisma).
 *
 * Used only when DATABASE_URL is set (see store.ts). The PrismaClient is
 * constructed lazily so the in-memory fallback path never loads a DB client.
 * Decimal columns come back as Prisma.Decimal → converted to number at the
 * boundary; all downstream math stays in decimal.js (src/series, src/rules).
 *
 * GUARDRAIL G4: never log PII or full holdings. This store handles market data
 * only in Step 1; user data arrives in a later, gated step.
 */

import { PrismaClient } from '@prisma/client';
import type { CorporateAction, CorporateActionType, Fundamentals, RawPricePoint, Ticker } from './types';
import type { SourceOfTruth } from './store';
import type { SampleCompany } from './fixtures/sample-stocks';

const globalForPrisma = globalThis as unknown as { __naijaxchPrisma?: PrismaClient };

function client(): PrismaClient {
  const existing = globalForPrisma.__naijaxchPrisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.__naijaxchPrisma = existing;
  return existing;
}

/** ISO `YYYY-MM-DD` from a date-only column. */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class PrismaSourceOfTruth implements SourceOfTruth {
  async listCompanies(): Promise<SampleCompany[]> {
    const rows = await client().company.findMany({ orderBy: { ticker: 'asc' } });
    return rows.map((c) => ({ ticker: c.ticker, name: c.name, sector: c.sector }));
  }

  async getCompany(ticker: Ticker): Promise<SampleCompany | null> {
    const c = await client().company.findUnique({ where: { ticker } });
    return c ? { ticker: c.ticker, name: c.name, sector: c.sector } : null;
  }

  async getRawPrices(ticker: Ticker): Promise<RawPricePoint[]> {
    const rows = await client().rawPrice.findMany({
      where: { ticker },
      orderBy: { date: 'asc' },
    });
    return rows.map((r) => ({
      ticker: r.ticker,
      date: isoDate(r.date),
      close: r.close.toNumber(),
      volume: Number(r.volume),
    }));
  }

  async getCorporateActions(ticker: Ticker): Promise<CorporateAction[]> {
    const rows = await client().corporateAction.findMany({
      where: { ticker },
      orderBy: { exDate: 'asc' },
    });
    return rows.map((a) => ({
      ticker: a.ticker,
      exDate: isoDate(a.exDate),
      type: a.type as CorporateActionType,
      terms: a.terms as unknown as CorporateAction['terms'],
    }));
  }

  async getFundamentals(ticker: Ticker): Promise<Fundamentals | null> {
    const f = await client().fundamentals.findFirst({
      where: { ticker },
      orderBy: { period: 'desc' },
    });
    if (!f) return null;
    return {
      ticker: f.ticker,
      period: f.period,
      revenue: f.revenue.toNumber(),
      netIncome: f.netIncome.toNumber(),
      shareCount: f.shareCount.toNumber(),
      dividendPerShare: f.dividendPerShare.toNumber(),
      totalEquity: f.totalEquity.toNumber(),
      totalDebt: f.totalDebt.toNumber(),
    };
  }
}
