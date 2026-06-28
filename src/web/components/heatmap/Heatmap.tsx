/**
 * Heatmap / market pulse (spec §7, MVP). Server component — it only displays
 * already-computed figures (G1) coloured by 1Y change. Tiles are grouped by
 * sector and link to each stock page.
 */

import { formatPct } from '@/series';
import { sectorColor } from '@/web/lib/sectors';
import type { ScreenerRow } from '../screener/types';
import { changeColor, computePulse } from './pulse';

function bySector(rows: ScreenerRow[]): [string, ScreenerRow[]][] {
  const groups = new Map<string, ScreenerRow[]>();
  for (const r of rows) {
    const list = groups.get(r.sector) ?? [];
    list.push(r);
    groups.set(r.sector, list);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export function Heatmap({ rows }: { rows: ScreenerRow[] }) {
  const pulse = computePulse(rows);
  const sectors = bySector(rows);

  return (
    <div className="heatmap">
      <div className="pulse" role="group" aria-label="Market pulse">
        <div className="pulse__stat">
          <span className="pulse__num pulse__num--up">{pulse.advancers}</span>
          <span className="pulse__label">Advancers</span>
        </div>
        <div className="pulse__stat">
          <span className="pulse__num pulse__num--down">{pulse.decliners}</span>
          <span className="pulse__label">Decliners</span>
        </div>
        <div className="pulse__stat">
          <span className="pulse__num">{pulse.unchanged}</span>
          <span className="pulse__label">Unchanged</span>
        </div>
        <div className="pulse__stat">
          <span
            className={`pulse__num ${
              pulse.avgChange != null && pulse.avgChange < 0 ? 'pulse__num--down' : 'pulse__num--up'
            }`}
          >
            {pulse.avgChange == null ? '—' : formatPct(pulse.avgChange)}
          </span>
          <span className="pulse__label">Avg 1Y</span>
        </div>
      </div>

      {sectors.map(([sector, sectorRows]) => (
        <section key={sector} className="heatmap__sector">
          <h2 className="heatmap__sector-title">
            <span className="dot" style={{ ['--sector' as string]: sectorColor(sector) }} aria-hidden />
            {sector}
          </h2>
          <div className="heatmap__grid">
            {sectorRows.map((r) => (
              <a
                key={r.ticker}
                href={`/stocks/${r.ticker}`}
                className="tile"
                style={{ backgroundColor: changeColor(r.changePct1Y) }}
                aria-label={`${r.ticker}: ${
                  r.changePct1Y == null ? 'no data' : formatPct(r.changePct1Y)
                } over 1 year`}
              >
                <span className="tile__ticker">{r.ticker}</span>
                <span className="tile__change">
                  {r.changePct1Y == null ? '—' : formatPct(r.changePct1Y)}
                </span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
