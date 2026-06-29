import { notFound } from 'next/navigation';
import { dataStore } from '@/data';
import {
  getAdjustedSeries,
  getGrowthReport,
  getPeHistory,
  getReportCard,
  getStoredSummary,
} from '@/api';
import { priceContext } from '@/series';
import { TrendChart } from '@/web/components/TrendChart';
import { ReportCard } from '@/web/components/reportcard/ReportCard';
import { AiSummary } from '@/web/components/ai/AiSummary';
import { CorporateActions } from '@/web/components/company/CorporateActions';
import { DelayedQuoteBadge } from '@/web/components/company/DelayedQuoteBadge';
import { SectorContext } from '@/web/components/company/SectorContext';
import { WatchButton } from '@/web/components/watchlist/WatchButton';
import { UpgradePrompt } from '@/web/components/billing/UpgradePrompt';
import { Disclaimer } from '@/web/components/common/Disclaimer';
import { isPremium } from '@/billing';
import { sectorColor, sectorWash } from '@/web/lib/sectors';

export default async function StockPage({ params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();
  const [company, series, reportCard, growth, valuation, actions, aiSummary, premium] =
    await Promise.all([
      dataStore.getCompany(ticker),
      getAdjustedSeries(ticker),
      getReportCard(ticker),
      getGrowthReport(ticker),
      getPeHistory(ticker),
      dataStore.getCorporateActions(ticker),
      getStoredSummary(ticker),
      isPremium(),
    ]);

  if (!company || !series) notFound();

  return (
    <div className="stock-page">
      <nav className="stock-page__back">
        <a href="/">← All companies</a>
      </nav>

      <div className="stock-page__heading">
        <div>
          <h1 className="stock-page__title">
            {company.name} <span className="stock-page__ticker">{company.ticker}</span>
          </h1>
          <p className="stock-page__sector">
            <span
              className="sector-chip"
              style={{
                ['--sector' as string]: sectorColor(company.sector),
                background: sectorWash(company.sector),
              }}
            >
              <span className="dot" aria-hidden />
              {company.sector}
            </span>
          </p>
          <DelayedQuoteBadge ticker={company.ticker} />
        </div>
        <WatchButton ticker={company.ticker} />
      </div>

      <TrendChart series={series} label={company.name} premium={premium} />

      {aiSummary &&
        (premium ? <AiSummary data={aiSummary} /> : <UpgradePrompt feature="AI summaries" />)}

      {reportCard && (
        <ReportCard
          card={reportCard}
          premium={premium}
          context={priceContext(series, '1Y')}
          growth={growth}
          valuation={valuation}
        />
      )}

      <SectorContext ticker={company.ticker} />

      <CorporateActions actions={actions} />

      <Disclaimer />
    </div>
  );
}
