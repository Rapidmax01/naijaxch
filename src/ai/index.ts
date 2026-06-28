/**
 * src/ai — grounded AI summary service + validation gate.
 *
 * GUARDRAIL G1: numbers are NEVER produced by the language model — it narrates
 * with {{placeholders}} and the gate substitutes validated, computed figures.
 * GUARDRAIL: changes to grounding / gate logic require human approval (CLAUDE.md
 * #4). Full mechanics: .claude/rules/ai-pipeline.md.
 */

export { buildFacts, type SummaryFacts } from './facts';
export {
  hasAdviceLanguage,
  hasRawDigits,
  renderNarration,
  usedPlaceholders,
  validateNarration,
  type GateResult,
} from './gate';
export { aiEnabled } from './client';
export { generateSummary, type SummaryResult, type SummaryStatus } from './summary';
