/**
 * src/rules — deterministic rules engine (NOT YET IMPLEMENTED).
 *
 * Analytical logic written once, run on every stock: valuation vs history,
 * dividend cover, debt/margin trend, growth → scores/flags → report-card data.
 * Pure, unit-tested functions. No human research per stock.
 *
 * GUARDRAIL G1: every numeric figure is computed here (or in src/series),
 * NEVER produced by the language model. Each metric needs a unit test against a
 * known-good fixture before it powers a report card.
 *
 * Scope note: building report cards is MVP, but is deferred to a later pass.
 */

export interface ReportCard {
  ticker: string;
  // Populated by deterministic metric functions (TODO).
  flags: never[];
  scores: Record<string, number>;
}
