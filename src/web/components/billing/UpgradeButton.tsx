'use client';

import { useState } from 'react';

/** Starts Paystack checkout (or sends logged-out users to register first). */
export function UpgradeButton({ authed, label = 'Upgrade to Premium' }: { authed: boolean; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!authed) {
      window.location.href = '/register';
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/subscribe', { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data.error ?? 'Could not start checkout.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <span className="upgrade">
      <button type="button" className="upgrade__btn" onClick={start} disabled={busy}>
        {busy ? 'Starting…' : label}
      </button>
      {error && (
        <span className="upgrade__error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
