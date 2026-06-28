/**
 * src/series — trend engine public API.
 *
 * The chart receives a ready PriceSeries from here. It does NOT fetch or adjust
 * (layering rule). UI and AI read computed values from this module.
 */

export type { PricePoint, PriceSeries } from './types';
export {
  actionFactor,
  bonusSplitFactor,
  buildAdjustedSeries,
  rightsFactor,
  terp,
} from './adjust';
export {
  DEFAULT_TIMEFRAME,
  TIMEFRAMES,
  windowSeries,
  windowStats,
  type Timeframe,
  type WindowStats,
} from './window';
export { buildPortfolioSeries, type Holding } from './portfolio';
export { bollinger, ema, sma, type BollingerBands } from './indicators';
export { formatCompact, formatDate, formatNaira, formatPct } from './format';
