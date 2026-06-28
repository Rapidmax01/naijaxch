/**
 * Read cached AI summaries for page render. Summaries are precomputed (never
 * generated on page load — see ai-pipeline rules). Returns null when there is
 * no DB or no cached summary, so the page simply omits the section.
 */

import { getPrismaClient } from '@/data/prisma-store';
import type { Ticker } from '@/data/types';

export interface StoredSummary {
  summary: string;
  period: string;
}

export async function getStoredSummary(ticker: Ticker): Promise<StoredSummary | null> {
  if (!process.env.DATABASE_URL) return null;
  const row = await getPrismaClient().aiSummary.findUnique({ where: { ticker } });
  return row ? { summary: row.summary, period: row.period } : null;
}
