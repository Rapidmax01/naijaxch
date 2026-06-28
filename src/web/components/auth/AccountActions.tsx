'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

export function AccountActions({ emailVerified }: { emailVerified: boolean }) {
  const [resent, setResent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    await fetch('/api/auth/verify-email/resend', { method: 'POST' }).catch(() => {});
    setBusy(false);
    setResent(true);
  }

  async function deleteAccount() {
    setBusy(true);
    const res = await fetch('/api/account/delete', { method: 'POST' });
    setBusy(false);
    if (res.ok) await signOut({ callbackUrl: '/' });
  }

  return (
    <div className="account-actions">
      {!emailVerified && (
        <div className="account-actions__banner" role="note">
          <span>Your email isn&apos;t verified yet.</span>
          {resent ? (
            <span className="account-actions__muted">Verification email sent.</span>
          ) : (
            <button type="button" onClick={resend} disabled={busy} className="header-auth__link">
              Resend verification
            </button>
          )}
        </div>
      )}

      <div className="account-actions__row">
        <a className="authform__google" href="/api/account/export">
          Export my data
        </a>
      </div>

      <div className="account-actions__danger">
        {confirming ? (
          <>
            <span>Delete your account and all data? This cannot be undone.</span>
            <button type="button" className="account-actions__delete" onClick={deleteAccount} disabled={busy}>
              {busy ? 'Deleting…' : 'Confirm delete'}
            </button>
            <button type="button" className="header-auth__link" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="account-actions__delete" onClick={() => setConfirming(true)}>
            Delete account
          </button>
        )}
      </div>
    </div>
  );
}
