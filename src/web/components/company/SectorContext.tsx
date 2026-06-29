'use client';

/**
 * SectorContext — how a company's computed metrics sit against its sector
 * peers' medians. Fetched lazily from a cached route so the stock page stays
 * light (no per-page universe aggregation).
 *
 * Display-only: every figure is computed server-side (G1). Lines are factual
 * comparisons — general information, never advice (G2). The page renders the
 * standing disclaimer.
 */

import { useEffect, useState } from 'react';
import type { SectorContext as SectorContextData, SectorContextItem } from '@/api';

const POSITION_WORD: Record<string, string> = {
  above: 'above',
  below: 'below',
  inline: 'in line with',
};

function line(item: SectorContextItem, sector: string): string | null {
  if (item.value == null || item.median == null || item.position == null) return null;
  return `${item.label} ${item.value}${item.unit} — ${POSITION_WORD[item.position]} the ${sector} median (${item.median}${item.unit}).`;
}

export function SectorContext({ ticker }: { ticker: string }) {
  const [data, setData] = useState<SectorContextData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'empty'>('loading');

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/sector/${ticker}`, { signal: controller.signal });
        if (!alive) return;
        if (!res.ok) {
          setState('empty');
          return;
        }
        setData((await res.json()) as SectorContextData);
        setState('ready');
      } catch {
        // Aborted/offline — leave the section out rather than erroring the page.
      }
    })();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [ticker]);

  if (state === 'loading') {
    return <div className="sector-context sector-context--loading" aria-hidden />;
  }
  if (state === 'empty' || !data) return null;

  const lines = data.items.map((i) => line(i, data.sector)).filter((l): l is string => l !== null);

  return (
    <section className="sector-context" aria-label={`${data.sector} sector context`}>
      <header className="sector-context__head">
        <h2 className="sector-context__title">Sector context</h2>
        <span className="sector-context__peers">
          {data.sector} · {data.peerCount} {data.peerCount === 1 ? 'name' : 'names'}
        </span>
      </header>

      {data.peerCount <= 1 ? (
        <p className="sector-context__note">
          The only {data.sector} name tracked so far — no peer comparison yet.
        </p>
      ) : lines.length === 0 ? (
        <p className="sector-context__note">No comparable metrics for this period.</p>
      ) : (
        <ul className="sector-context__list">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
