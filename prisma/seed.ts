/**
 * Seed the source-of-truth DB with the current sample NGX data so the DB-backed
 * store matches the in-memory fixtures exactly. Idempotent (upserts).
 *
 * Run with: `npm run db:seed` (requires a running DB + applied migrations).
 * Placeholder data only — real figures arrive via src/ingestion once the
 * licensed NGX feed is wired (G3).
 */

import { Prisma, PrismaClient } from '@prisma/client';
import {
  SAMPLE_COMPANIES,
  SAMPLE_CORPORATE_ACTIONS,
  SAMPLE_FUNDAMENTALS,
  SAMPLE_RAW_PRICES,
} from '../src/data/fixtures/sample-stocks';

const prisma = new PrismaClient();

async function main() {
  for (const c of SAMPLE_COMPANIES) {
    await prisma.company.upsert({
      where: { ticker: c.ticker },
      create: { ticker: c.ticker, name: c.name, sector: c.sector },
      update: { name: c.name, sector: c.sector },
    });
  }

  for (const [ticker, points] of Object.entries(SAMPLE_RAW_PRICES)) {
    // Bulk insert; skip duplicates so re-runs are safe.
    await prisma.rawPrice.createMany({
      data: points.map((p) => ({
        ticker,
        date: new Date(`${p.date}T00:00:00Z`),
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: BigInt(p.volume),
      })),
      skipDuplicates: true,
    });
  }

  for (const actions of Object.values(SAMPLE_CORPORATE_ACTIONS)) {
    for (const a of actions) {
      await prisma.corporateAction.create({
        data: {
          ticker: a.ticker,
          exDate: new Date(`${a.exDate}T00:00:00Z`),
          type: a.type,
          terms: a.terms as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  for (const f of Object.values(SAMPLE_FUNDAMENTALS)) {
    await prisma.fundamentals.upsert({
      where: { ticker_period: { ticker: f.ticker, period: f.period } },
      create: f,
      update: f,
    });
  }

  const counts = {
    companies: await prisma.company.count(),
    rawPrices: await prisma.rawPrice.count(),
    corporateActions: await prisma.corporateAction.count(),
    fundamentals: await prisma.fundamentals.count(),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
