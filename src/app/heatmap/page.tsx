import { getScreenerRows } from '@/api';
import { Heatmap } from '@/web/components/heatmap/Heatmap';
import { Disclaimer } from '@/web/components/common/Disclaimer';

// Reads the source of truth at request time — don't prerender against the DB.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Market heatmap — NaijaXch',
};

export default async function HeatmapPage() {
  const rows = await getScreenerRows();

  return (
    <div className="heatmap-page">
      <nav className="stock-page__back">
        <a href="/">← Home</a>
      </nav>

      <h1 className="stock-page__title">Market heatmap</h1>
      <p className="stock-page__sector">
        NGX names coloured by their trailing one-year trend, grouped by sector. Green is up, red is
        down — intensity tracks the size of the move.
      </p>

      <Heatmap rows={rows} />

      <Disclaimer />
    </div>
  );
}
