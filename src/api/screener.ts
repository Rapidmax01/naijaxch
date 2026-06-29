/**
 * Screener service. Assembles one row per company from already-computed values:
 * latest adjusted close + 1Y change from the trend engine, and ratios from the
 * rules engine. No figures are derived here (G1) — it only gathers them.
 */

import { dataStore } from '@/data';
import { computeGrowth, computeReportCard } from '@/rules';
import { windowSeries, windowStats } from '@/series';
import { getAdjustedSeries } from './series';
import { peHistoryFrom } from './valuation';
import type { ScreenerRow } from '@/web/components/screener/types';

export async function getScreenerRows(): Promise<ScreenerRow[]> {
  const companies = await dataStore.listCompanies();

  const rows = await Promise.all(
    companies.map(async (c): Promise<ScreenerRow | null> => {
      const [series, history] = await Promise.all([
        getAdjustedSeries(c.ticker),
        dataStore.getFundamentalsHistory(c.ticker),
      ]);
      if (!series || series.points.length === 0) return null;

      const price = series.points.at(-1)!.adjClose;
      const oneYear = windowStats(windowSeries(series, '1Y'));
      const fundamentals = history.at(-1) ?? null;
      const card = fundamentals ? computeReportCard(fundamentals, price) : null;
      const growth = computeGrowth(history);
      const valuation = peHistoryFrom(history, series);

      const metric = (key: string): number | null =>
        card?.metrics.find((m) => m.key === key)?.value ?? null;
      const growthMetric = (key: string): number | null =>
        growth?.metrics.find((m) => m.key === key)?.value ?? null;

      return {
        ticker: c.ticker,
        name: c.name,
        sector: c.sector,
        price,
        changePct1Y: oneYear?.changePct ?? null,
        pe: metric('pe'),
        dividendYield: metric('dividendYield'),
        netMargin: metric('netMargin'),
        dividendCover: metric('dividendCover'),
        debtToEquity: metric('debtToEquity'),
        avgVolume: oneYear?.avgVolume ?? null,
        thinlyTraded: oneYear?.lowVolume ?? false,
        revenueGrowth: growthMetric('revenueGrowth'),
        roe: growthMetric('roe'),
        peVsAvg: valuation?.pctVsAverage ?? null,
      };
    }),
  );

  return rows.filter((r): r is ScreenerRow => r !== null);
}
