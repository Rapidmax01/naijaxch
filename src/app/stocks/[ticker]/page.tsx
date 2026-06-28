import { notFound } from 'next/navigation';
import { dataStore } from '@/data';
import { getAdjustedSeries } from '@/api';
import { TrendChart } from '@/web/components/TrendChart';
import { Disclaimer } from '@/web/components/common/Disclaimer';

export default async function StockPage({ params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();
  const [company, series] = await Promise.all([
    dataStore.getCompany(ticker),
    getAdjustedSeries(ticker),
  ]);

  if (!company || !series) notFound();

  return (
    <div className="stock-page">
      <nav className="stock-page__back">
        <a href="/">← All companies</a>
      </nav>

      <h1 className="stock-page__title">
        {company.name} <span className="stock-page__ticker">{company.ticker}</span>
      </h1>
      <p className="stock-page__sector">{company.sector}</p>

      <TrendChart series={series} label={company.name} />

      <Disclaimer />
    </div>
  );
}
