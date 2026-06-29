'use client';

/**
 * DelayedQuoteBadge — the last delayed/EOD price on a company page (Proposal
 * 0005). Display-only; the trend chart stays EOD (TS2) and never uses this.
 *
 * ALWAYS renders the delay label + "as of" timestamp (G3 / spec §9 disclosure).
 * Numbers are computed server-side from the source of truth (G1/TS4) and only
 * formatted here. Polls on a 60s interval — a display refresh, not a tick feed.
 */

import { useEffect, useState } from 'react';
import { formatDate, formatNaira, formatPct } from '@/series';
import type { DelayedQuote } from '@/data';

const REFRESH_MS = 60_000;

function delayLabel(delayMinutes: number | null): string {
  return delayMinutes == null ? 'End of day' : `${delayMinutes}-min delayed`;
}

export function DelayedQuoteBadge({ ticker }: { ticker: string }) {
  const [quote, setQuote] = useState<DelayedQuote | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'empty'>('loading');

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(`/api/quote/${ticker}`, { signal: controller.signal });
        if (!alive) return;
        if (!res.ok) {
          setState('empty');
          return;
        }
        const data = (await res.json()) as DelayedQuote;
        if (!alive) return;
        setQuote(data);
        setState('ready');
      } catch {
        // Aborted or offline — keep the last good value; never crash the page.
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      controller.abort();
      clearInterval(id);
    };
  }, [ticker]);

  if (state === 'loading') {
    return <div className="quote-badge quote-badge--loading" aria-hidden />;
  }

  if (state === 'empty' || !quote) {
    return (
      <div className="quote-badge quote-badge--empty" role="note">
        <span className="quote-badge__price">—</span>
        <span className="quote-badge__label">No recent quote</span>
      </div>
    );
  }

  const up = quote.change >= 0;
  const color = up ? 'var(--up)' : 'var(--down)';

  return (
    <div className="quote-badge" role="note" aria-label={`${ticker} delayed quote`}>
      <span className="quote-badge__price">{formatNaira(quote.price)}</span>
      <span className="quote-badge__change" style={{ color }}>
        {up ? '▲' : '▼'} {formatNaira(quote.change)} ({formatPct(quote.changePct)})
      </span>
      <span className="quote-badge__label">
        {delayLabel(quote.delayMinutes)} · as of {formatDate(quote.asOf)}
      </span>
    </div>
  );
}
