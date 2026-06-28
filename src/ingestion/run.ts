/**
 * Ingestion entry point. Run with `npm run ingest` (requires DATABASE_URL +
 * applied migrations). Uses the real NGX delayed/EOD source when configured
 * (NGX_DATA_API_BASE + key, G3), else the fixture source.
 */

import { runIngestion } from './jobs';
import { selectMarketDataSource } from './sources/select';
import { PrismaMarketDataWriter } from './writer';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required to run ingestion.');
    process.exit(1);
  }

  const { source, name } = selectMarketDataSource();
  console.log(`Ingesting from the ${name} source…`);
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
