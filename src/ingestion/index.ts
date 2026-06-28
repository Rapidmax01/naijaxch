/**
 * src/ingestion — scheduled jobs (NOT YET IMPLEMENTED).
 *
 *  - price poller: licensed NGX delayed/EOD closes → src/data (G3).
 *  - filings poller + PDF parser: statements → structured fundamentals.
 *  - corporate-actions sync: bonus/rights/splits → feeds the adjustment engine.
 *
 * GUARDRAIL G3: delayed/EOD only. NEVER wire a real-time/tick feed without
 * explicit human approval (separate, paid licence tier). New third-party data
 * integrations require sign-off (CLAUDE.md).
 */

export const INGESTION_TODO = [
  'price-poller (delayed/EOD)',
  'filings-poller + PDF parser',
  'corporate-actions-sync',
] as const;
