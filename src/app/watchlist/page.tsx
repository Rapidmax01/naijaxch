import { getScreenerRows } from '@/api';
import { WatchlistView } from '@/web/components/watchlist/WatchlistView';
import { Disclaimer } from '@/web/components/common/Disclaimer';

// Reads the source of truth at request time — don't prerender against the DB.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Watchlist — NaijaXch',
};

export default async function WatchlistPage() {
  const rows = await getScreenerRows();

  return (
    <div className="watchlist-page">
      <nav className="stock-page__back">
        <a href="/">← Home</a>
      </nav>

      <h1 className="stock-page__title">Watchlist</h1>
      <p className="stock-page__sector">
        Saved in your browser only — no account needed. Add names from any stock page or the
        screener.
      </p>

      <WatchlistView rows={rows} />

      <Disclaimer />
    </div>
  );
}
