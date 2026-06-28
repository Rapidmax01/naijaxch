import { notFound } from 'next/navigation';
import { dataStore } from '@/data';
import { getAdjustedSeries, getReportCard } from '@/api';
import { TrendChart } from '@/web/components/TrendChart';
import { ReportCard } from '@/web/components/reportcard/ReportCard';
import { CorporateActions } from '@/web/components/company/CorporateActions';
import { WatchButton } from '@/web/components/watchlist/WatchButton';
import { Disclaimer } from '@/web/components/common/Disclaimer';

export default async function StockPage({ params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();
  const [company, series, reportCard, actions] = await Promise.all([
    dataStore.getCompany(ticker),
    getAdjustedSeries(ticker),
    getReportCard(ticker),
    dataStore.getCorporateActions(ticker),
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
          <p className="stock-page__sector">{company.sector}</p>
        </div>
        <WatchButton ticker={company.ticker} />
      </div>

      <TrendChart series={series} label={company.name} />

      {reportCard && <ReportCard card={reportCard} />}

      <CorporateActions actions={actions} />

      <Disclaimer />
    </div>
  );
}
