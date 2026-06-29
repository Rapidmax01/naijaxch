/**
 * Build the grounded facts for an AI summary: the placeholder→value map the
 * gate substitutes after validation, plus the qualitative prompt context the
 * model is allowed to see. The model NEVER sees numeric values (G1) — only
 * placeholder tokens and each metric's healthy/neutral/watch status.
 */

import type { SampleCompany } from '@/data';
import type { GrowthReport, PeHistory, ReportCard } from '@/rules';
import { formatNaira } from '@/series';

export interface SummaryFacts {
  /** placeholder key → already-formatted display string (substituted post-gate). */
  values: Record<string, string>;
  /** Lines shown to the model: label + placeholder token + status word, no numbers. */
  promptLines: string[];
  /** Placeholder keys the model is allowed to use. */
  allowedKeys: string[];
}

/**
 * Build the grounded facts. Optional growth/valuation context (proposal 0007)
 * is added ONLY when computable — when omitted, no placeholder is offered, so
 * the model can't reference a figure that doesn't exist (same fail-safe as a
 * null metric). The model still sees qualitative direction only, never numbers.
 */
export function buildFacts(
  company: SampleCompany,
  card: ReportCard,
  growth?: GrowthReport | null,
  valuation?: PeHistory | null,
): SummaryFacts {
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

  // Growth context — revenue growth + ROE (0007, D-B). Direction only to the model.
  if (growth) {
    const rev = growth.metrics.find((m) => m.key === 'revenueGrowth');
    if (rev?.value != null) {
      values.revenueGrowth = rev.display;
      promptLines.push(
        `{{revenueGrowth}} — Revenue growth year-on-year (direction: ${rev.value >= 0 ? 'up' : 'down'})`,
      );
    }
    const roe = growth.metrics.find((m) => m.key === 'roe');
    if (roe?.value != null) {
      values.roe = roe.display;
      promptLines.push(`{{roe}} — Return on equity (a profitability level)`);
    }
  }

  // Valuation context — a complete, pre-written sentence (0007, D-A). The model
  // places the token; it never authors the comparison/judgment.
  if (valuation?.note) {
    values.peContext = valuation.note;
    const position =
      valuation.pctVsAverage <= -5
        ? 'below average'
        : valuation.pctVsAverage >= 5
          ? 'above average'
          : 'in line with average';
    promptLines.push(
      `{{peContext}} — A complete sentence comparing the current P/E to its multi-year average (position: ${position}). Use it as its own sentence; do not write figures around it.`,
    );
  }

  return { values, promptLines, allowedKeys: Object.keys(values) };
}
