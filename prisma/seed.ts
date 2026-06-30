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
  SAMPLE_DISCLOSURES,
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

  // Replace the whole price set so re-runs reflect the current fixtures.
  // (Previously this used createMany(skipDuplicates), which SKIPPED existing
  // rows — so after the series was extended/rescaled, stale rows survived and
  // left a discontinuity at the old/new boundary. Delete-then-insert is
  // authoritative and idempotent.)
  await prisma.rawPrice.deleteMany({});
  for (const [ticker, points] of Object.entries(SAMPLE_RAW_PRICES)) {
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
    });
  }

  // The fixtures are authoritative for the dev DB, so REPLACE the whole set.
  // (Previously this used create() with no dedup, so every reseed duplicated
  // corporate actions — which double-applies adjustment factors and corrupts
  // adjClose, G6. Delete-then-insert is idempotent and clears stale rows.)
  await prisma.corporateAction.deleteMany({});
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

  for (const history of Object.values(SAMPLE_FUNDAMENTALS)) {
    for (const f of history) {
      await prisma.fundamentals.upsert({
        where: { ticker_period: { ticker: f.ticker, period: f.period } },
        create: f,
        update: f,
      });
    }
  }

  // Replace the whole set — the fixtures are authoritative, and a sourceUrl
  // change would otherwise orphan the old rows rather than update them.
  await prisma.disclosure.deleteMany({});
  for (const items of Object.values(SAMPLE_DISCLOSURES)) {
    for (const d of items) {
      await prisma.disclosure.create({ data: { ...d, publishedAt: new Date(d.publishedAt) } });
    }
  }

  const counts = {
    companies: await prisma.company.count(),
    rawPrices: await prisma.rawPrice.count(),
    corporateActions: await prisma.corporateAction.count(),
    fundamentals: await prisma.fundamentals.count(),
    disclosures: await prisma.disclosure.count(),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
