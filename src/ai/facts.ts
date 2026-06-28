/**
 * Build the grounded facts for an AI summary: the placeholder→value map the
 * gate substitutes after validation, plus the qualitative prompt context the
 * model is allowed to see. The model NEVER sees numeric values (G1) — only
 * placeholder tokens and each metric's healthy/neutral/watch status.
 */

import type { SampleCompany } from '@/data';
import type { ReportCard } from '@/rules';
import { formatNaira } from '@/series';

export interface SummaryFacts {
  /** placeholder key → already-formatted display string (substituted post-gate). */
  values: Record<string, string>;
  /** Lines shown to the model: label + placeholder token + status word, no numbers. */
  promptLines: string[];
  /** Placeholder keys the model is allowed to use. */
  allowedKeys: string[];
}

export function buildFacts(company: SampleCompany, card: ReportCard): SummaryFacts {
  const values: Record<string, string> = {
    company: company.name,
    period: card.period,
    price: formatNaira(card.currentPrice),
  };
  const promptLines: string[] = [
    `Company: {{company}} (sector: ${company.sector})`,
    `Reporting period: {{period}}`,
    `Latest price: {{price}}`,
  ];

  for (const m of card.metrics) {
    values[m.key] = m.display;
    promptLines.push(`{{${m.key}}} — ${m.label} (status: ${m.status})`);
  }

  return { values, promptLines, allowedKeys: Object.keys(values) };
}
