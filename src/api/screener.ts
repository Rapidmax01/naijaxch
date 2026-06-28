/**
 * Screener service. Assembles one row per company from already-computed values:
 * latest adjusted close + 1Y change from the trend engine, and ratios from the
 * rules engine. No figures are derived here (G1) — it only gathers them.
 */

import { dataStore } from '@/data';
import { computeReportCard } from '@/rules';
import { windowSeries, windowStats } from '@/series';
import { getAdjustedSeries } from './series';
import type { ScreenerRow } from '@/web/components/screener/types';

export async function getScreenerRows(): Promise<ScreenerRow[]> {
  const companies = await dataStore.listCompanies();

  const rows = await Promise.all(
    companies.map(async (c): Promise<ScreenerRow | null> => {
      const [series, fundamentals] = await Promise.all([
        getAdjustedSeries(c.ticker),
        dataStore.getFundamentals(c.ticker),
      ]);
      if (!series || series.points.length === 0) return null;

      const price = series.points.at(-1)!.adjClose;
      const oneYear = windowStats(windowSeries(series, '1Y'));
      const card = fundamentals ? computeReportCard(fundamentals, price) : null;

      const metric = (key: string): number | null =>
        card?.metrics.find((m) => m.key === key)?.value ?? null;

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
      };
    }),
  );

  return rows.filter((r): r is ScreenerRow => r !== null);
}
