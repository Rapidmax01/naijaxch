'use client';

import { useState } from 'react';

export function CancelButton() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/billing/cancel', { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      setDone(true);
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Could not cancel.');
    }
  }

  if (done) {
    return <span className="account-actions__muted">Premium will end at the period close.</span>;
  }

  return (
    <span className="billing-cancel">
      {confirming ? (
        <>
          <button type="button" className="account-actions__delete" onClick={cancel} disabled={busy}>
            {busy ? 'Cancelling…' : 'Confirm cancel'}
          </button>
          <button type="button" className="header-auth__link" onClick={() => setConfirming(false)}>
            Keep Premium
          </button>
        </>
      ) : (
        <button type="button" className="header-auth__link" onClick={() => setConfirming(true)}>
          Cancel subscription
        </button>
      )}
      {error && (
        <span className="upgrade__error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
