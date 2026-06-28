/**
 * Generate + cache AI summaries (run once per filing; never on page load).
 * Run with `npm run ai:generate` (requires DATABASE_URL + ANTHROPIC_API_KEY).
 *
 * For each company: compute the report card → grounded generate → validation
 * gate → store only if the gate passes. Rejected/disabled summaries are logged
 * and skipped (never published), so a wrong figure can never reach a page.
 */

import { dataStore } from '@/data';
import { getReportCard } from '@/api';
import { aiEnabled, generateSummary } from '@/ai';
import { getPrismaClient } from '@/data/prisma-store';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }
  if (!aiEnabled()) {
    console.error('ANTHROPIC_API_KEY is required to generate summaries.');
    process.exit(1);
  }

  const model = process.env.AI_MODEL ?? 'claude-opus-4-8';
  const db = getPrismaClient();
  const companies = await dataStore.listCompanies();

  for (const company of companies) {
    const card = await getReportCard(company.ticker);
    if (!card) {
      console.log(`${company.ticker}: no report card — skipped`);
      continue;
    }

    const result = await generateSummary(company, card);
    if (result.status !== 'ok' || !result.summary) {
      console.log(`${company.ticker}: ${result.status}${result.reason ? ` (${result.reason})` : ''} — not stored`);
      continue;
    }

    await db.aiSummary.upsert({
      where: { ticker: company.ticker },
      create: { ticker: company.ticker, period: card.period, summary: result.summary, model },
      update: { period: card.period, summary: result.summary, model },
    });
    console.log(`${company.ticker}: stored`);
  }

  console.log('AI summary generation complete.');
}

main()
  .catch((e) => {
    console.error('Generation failed:', e);
    process.exit(1);
  })
  .finally(() => getPrismaClient().$disconnect());
