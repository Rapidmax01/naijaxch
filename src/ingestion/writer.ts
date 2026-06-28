/**
 * Market-data writer — persists cleaned rows into the source of truth.
 * The interface lets the ingestion jobs be tested with a fake writer; the
 * Prisma implementation is the production path (idempotent upserts).
 *
 * GUARDRAIL G4: market data only here. Never log full rows wholesale once user
 * data is involved in later steps.
 */

import { Prisma } from '@prisma/client';
import type { Company, CorporateAction, Fundamentals, RawPricePoint } from '@/data/types';
import { getPrismaClient } from '@/data/prisma-store';

export interface MarketDataWriter {
  upsertCompanies(companies: Company[]): Promise<number>;
  upsertRawPrices(points: RawPricePoint[]): Promise<number>;
  upsertCorporateActions(actions: CorporateAction[]): Promise<number>;
  upsertFundamentals(rows: Fundamentals[]): Promise<number>;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class PrismaMarketDataWriter implements MarketDataWriter {
  async upsertCompanies(companies: Company[]): Promise<number> {
    const db = getPrismaClient();
    for (const c of companies) {
      const data = {
        name: c.name,
        sector: c.sector,
        sharesOutstanding: c.sharesOutstanding ?? null,
      };
      await db.company.upsert({
        where: { ticker: c.ticker },
        create: { ticker: c.ticker, ...data },
        update: data,
      });
    }
    return companies.length;
  }

  async upsertRawPrices(points: RawPricePoint[]): Promise<number> {
    if (points.length === 0) return 0;
    const res = await getPrismaClient().rawPrice.createMany({
      data: points.map((p) => ({
        ticker: p.ticker,
        date: new Date(`${p.date}T00:00:00Z`),
        close: p.close,
        volume: BigInt(p.volume),
      })),
      skipDuplicates: true, // re-ingest is safe; existing (ticker,date) kept
    });
    return res.count;
  }

  async upsertCorporateActions(actions: CorporateAction[]): Promise<number> {
    const db = getPrismaClient();
    const byTicker = new Map<string, CorporateAction[]>();
    for (const a of actions) {
      const list = byTicker.get(a.ticker) ?? [];
      list.push(a);
      byTicker.set(a.ticker, list);
    }

    let written = 0;
    for (const [ticker, list] of byTicker) {
      const existing = await db.corporateAction.findMany({
        where: { ticker },
        select: { exDate: true, type: true },
      });
      const have = new Set(existing.map((e) => `${isoDate(e.exDate)}|${e.type}`));
      const toCreate = list.filter((a) => !have.has(`${a.exDate}|${a.type}`));
      if (toCreate.length > 0) {
        await db.corporateAction.createMany({
          data: toCreate.map((a) => ({
            ticker: a.ticker,
            exDate: new Date(`${a.exDate}T00:00:00Z`),
            type: a.type,
            terms: a.terms as unknown as Prisma.InputJsonValue,
          })),
        });
        written += toCreate.length;
      }
    }
    return written;
  }

  async upsertFundamentals(rows: Fundamentals[]): Promise<number> {
    const db = getPrismaClient();
    for (const f of rows) {
      await db.fundamentals.upsert({
        where: { ticker_period: { ticker: f.ticker, period: f.period } },
        create: f,
        update: f,
      });
    }
    return rows.length;
  }
}
