/**
 * Ingestion entry point. Run with `npm run ingest` (requires DATABASE_URL +
 * applied migrations). Uses the fixture source until the licensed NGX delayed/
 * EOD feed is wired (G3) — swap to NgxMarketDataSource once approved.
 */

import { runIngestion } from './jobs';
import { FixtureMarketDataSource } from './sources/fixture-source';
import { PrismaMarketDataWriter } from './writer';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required to run ingestion.');
    process.exit(1);
  }

  const source = new FixtureMarketDataSource();
  const writer = new PrismaMarketDataWriter();
  const summary = await runIngestion(source, writer);
  console.log('Ingestion complete:', summary);
}

main()
  .catch((e) => {
    console.error('Ingestion failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void import('@/data/prisma-store').then(({ getPrismaClient }) => getPrismaClient().$disconnect());
  });
