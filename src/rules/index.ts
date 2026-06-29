/**
 * src/rules — deterministic rules engine public API.
 *
 * GUARDRAIL G1: every numeric figure is computed here (decimal.js), NEVER
 * produced by the language model. Each metric is unit-tested against a
 * known-good fixture before it powers a report card.
 */

export {
  computeReportCard,
  type Metric,
  type MetricStatus,
  type ReportCard,
  type ReportCardSummary,
} from './report-card';
