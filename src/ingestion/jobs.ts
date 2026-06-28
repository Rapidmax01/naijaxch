/**
 * Ingestion orchestration: pull from a MarketDataSource, validate/clean, and
 * write to the source of truth. Depends only on the source + writer interfaces,
 * so it is fully testable without a database (see jobs.test.ts).
 */

import { cleanActions, cleanFundamentals, cleanPrices } from './validate';
import type { MarketDataSource } from './sources/types';
import type { MarketDataWriter } from './writer';

export interface IngestionSummary {
  companies: number;
  rawPrices: number;
  corporateActions: number;
  fundamentals: number;
}

export async function runIngestion(
  source: MarketDataSource,
  writer: MarketDataWriter,
): Promise<IngestionSummary> {
  const companies = await source.listCompanies();

  const summary: IngestionSummary = {
    companies: await writer.upsertCompanies(companies),
    rawPrices: 0,
    corporateActions: 0,
    fundamentals: 0,
  };

  for (const company of companies) {
    const prices = cleanPrices(await source.fetchDailyCloses(company.ticker));
    summary.rawPrices += await writer.upsertRawPrices(prices);

    const actions = cleanActions(await source.fetchCorporateActions(company.ticker));
    summary.corporateActions += await writer.upsertCorporateActions(actions);

    const fundamentals = cleanFundamentals(await source.fetchFundamentals(company.ticker));
    summary.fundamentals += await writer.upsertFundamentals(fundamentals);
  }

  return summary;
}
