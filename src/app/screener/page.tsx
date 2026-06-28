import { getScreenerRows } from '@/api';
import { Screener } from '@/web/components/screener/Screener';
import { Disclaimer } from '@/web/components/common/Disclaimer';

export const metadata = {
  title: 'Screener — NaijaXch',
};

export default async function ScreenerPage() {
  const rows = await getScreenerRows();

  return (
    <div className="screener-page">
      <nav className="stock-page__back">
        <a href="/">← Home</a>
      </nav>

      <h1 className="stock-page__title">Screener</h1>
      <p className="stock-page__sector">
        Filter and sort NGX names by valuation, yield, and trend — all figures computed from the
        adjusted EOD series and reported fundamentals.
      </p>

      <Screener rows={rows} />

      <Disclaimer />
    </div>
  );
}
