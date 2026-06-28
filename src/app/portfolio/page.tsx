import { dataStore } from '@/data';
import { PortfolioBuilder } from '@/web/components/portfolio/PortfolioBuilder';
import { Disclaimer } from '@/web/components/common/Disclaimer';

export const metadata = {
  title: 'Portfolio trend — NaijaXch',
};

export default async function PortfolioPage() {
  const companies = await dataStore.listCompanies();

  return (
    <div className="portfolio-page">
      <nav className="stock-page__back">
        <a href="/">← Home</a>
      </nav>

      <h1 className="stock-page__title">Portfolio trend</h1>
      <p className="stock-page__sector">
        Enter holdings manually to see their combined value over time — the same fluid, adjusted
        EOD chart, summed across your stocks.
      </p>

      <PortfolioBuilder companies={companies} />

      <Disclaimer />
    </div>
  );
}
