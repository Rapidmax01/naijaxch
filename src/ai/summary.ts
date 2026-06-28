/**
 * AI summary orchestration: facts → grounded generation → validation gate →
 * render. The model never emits a number (G1); the gate rejects any violation
 * rather than publish a wrong figure. See .claude/rules/ai-pipeline.md.
 */

import type { SampleCompany } from '@/data';
import type { ReportCard } from '@/rules';
import { buildFacts, type SummaryFacts } from './facts';
import { renderNarration, validateNarration } from './gate';
import { aiEnabled, generateNarration } from './client';

export type SummaryStatus = 'ok' | 'disabled' | 'rejected';

export interface SummaryResult {
  status: SummaryStatus;
  summary: string | null;
  reason?: string;
}

const SYSTEM_PROMPT = `You write a short, plain-English summary of a Nigerian Exchange (NGX) company's latest report card, for a general audience.

STRICT RULES:
- Refer to every figure ONLY by its placeholder token, e.g. {{eps}}. You must NEVER write any digit (0-9) yourself.
- Use ONLY the placeholders you are given. Never invent a placeholder or a figure.
- General information only. NEVER give advice: do not say "buy", "sell", "hold", "you should", "we recommend", or anything individualised.
- Neutral, factual tone — "The data shows…". 2 to 3 sentences.
- Output ONLY the summary sentences: no preamble, no headings, no bullet points.`;

function buildUserPrompt(facts: SummaryFacts): string {
  return [
    "Here is the company's report card. Each metric carries a status (healthy / neutral / watch).",
    'Narrate the overall picture using the placeholder tokens for any figure.',
    '',
    ...facts.promptLines,
    '',
    'Write the summary now.',
  ].join('\n');
}

export async function generateSummary(
  company: SampleCompany,
  card: ReportCard,
): Promise<SummaryResult> {
  if (!aiEnabled()) return { status: 'disabled', summary: null };

  const facts = buildFacts(company, card);
  const raw = await generateNarration(SYSTEM_PROMPT, buildUserPrompt(facts));

  const gate = validateNarration(raw, facts.allowedKeys);
  if (!gate.ok) return { status: 'rejected', summary: null, reason: gate.reason };

  return { status: 'ok', summary: renderNarration(raw, facts.values) };
}
