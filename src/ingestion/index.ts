/**
 * src/ingestion — scheduled/CLI jobs that populate the source of truth.
 *
 * GUARDRAIL G3: delayed/EOD only. NEVER wire a real-time/tick feed without
 * explicit human approval (separate, paid licence). New third-party data
 * integrations require sign-off (CLAUDE.md #6).
 *
 * Phase-1 status: pipeline built; the real NGX adapter is wired behind the
 * MarketDataSource interface and used when configured (NGX_DATA_API_BASE + key,
 * delayed/EOD only), else the fixture source. Run with `npm run ingest`.
 */

export { runIngestion, type IngestionSummary } from './jobs';
export type { MarketDataSource } from './sources/types';
export { FixtureMarketDataSource } from './sources/fixture-source';
export { NgxMarketDataSource, ngxSourceConfigured } from './sources/ngx-source';
export { selectMarketDataSource } from './sources/select';
export { PrismaMarketDataWriter, type MarketDataWriter } from './writer';
export {
  cleanActions,
  cleanFundamentals,
  cleanPrices,
  isValidPrice,
} from './validate';
