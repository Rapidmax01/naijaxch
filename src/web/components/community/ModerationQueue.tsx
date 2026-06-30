'use client';

/**
 * ModerationQueue (proposal 0008) — admin-only review of reported posts.
 * Reads the open queue and resolves a report (hide / remove / dismiss). The
 * page already gates on isAdmin; the API re-checks (never trust the client).
 */

import { useEffect, useState } from 'react';
import type { ModItem } from '@/api';

const REASON_LABEL: Record<string, string> = {
  advice: 'Advice / tip',
  manipulation: 'Manipulation',
  spam: 'Spam / ad',
  abuse: 'Abuse',
  'personal-info': 'Personal info',
  other: 'Other',
};

export function ModerationQueue() {
  const [queue, setQueue] = useState<ModItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const res = await fetch('/api/community/moderate');
    if (res.ok) setQueue(((await res.json()) as { queue: ModItem[] }).queue);
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(reportId: string, action: 'hide' | 'remove' | 'dismiss') {
    await fetch('/api/community/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, action }),
    });
    await load();
  }

  if (!loaded) return <p className="community__empty">Loading queue…</p>;
  if (queue.length === 0) return <p className="community__empty">No open reports. 🎉</p>;

  return (
    <ul className="modqueue">
      {queue.map((m) => (
        <li key={m.reportId} className="modqueue__item">
          <div className="modqueue__meta">
            <span className="modqueue__reason">{REASON_LABEL[m.reason] ?? m.reason}</span>
            <span className="modqueue__ticker">{m.ticker}</span>
            <span className="community__time">by {m.author}</span>
            {m.postStatus !== 'visible' && (
              <span className="modqueue__status">({m.postStatus})</span>
            )}
          </div>
          <p className="community__body">{m.body}</p>
          <div className="modqueue__actions">
            <button type="button" className="btn btn--ghost" onClick={() => act(m.reportId, 'hide')}>
              Hide
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => act(m.reportId, 'remove')}>
              Remove
            </button>
            <button type="button" className="community__action" onClick={() => act(m.reportId, 'dismiss')}>
              Dismiss report
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
