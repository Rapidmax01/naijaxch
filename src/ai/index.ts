/**
 * src/ai — grounded AI summary service + validation gate (NOT YET IMPLEMENTED).
 *
 * The LLM only narrates figures that have ALREADY been computed and validated
 * by src/rules / src/series. It NEVER produces, estimates, or fills in a number
 * (G1 / TS4). A validation gate must block publishing if any number in the AI
 * output does not trace to source data. Generate once per filing, cache.
 *
 * GUARDRAIL: changes to AI grounding / validation-gate logic require human
 * approval (CLAUDE.md). Full mechanics belong in .claude/rules/ai-pipeline.md
 * (to be authored with sign-off). Default model: claude-opus-4-8.
 *
 * Intentionally a stub — implementing the grounding/gate needs explicit sign-off.
 */

export interface GroundedSummaryInput {
  ticker: string;
  /** Pre-computed, validated figures the model may narrate (never invent). */
  figures: Record<string, number>;
}

export async function generateGroundedSummary(_input: GroundedSummaryInput): Promise<never> {
  throw new Error(
    'AI summary service not implemented. Requires human approval for grounding + validation-gate logic (G1).',
  );
}
