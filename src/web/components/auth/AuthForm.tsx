'use client';

/**
 * Shared login / sign-up form. For sign-up it POSTs to /api/auth/register then
 * signs in; for login it calls Auth.js signIn directly. Also offers Google when
 * configured. Passwords are never stored or logged client-side.
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';

type Mode = 'login' | 'register';

export function AuthForm({ mode, googleEnabled }: { mode: Mode; googleEnabled: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? 'Could not create your account.');
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        throw new Error('Invalid email or password.');
      }
      window.location.href = '/account';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authform">
      <form onSubmit={onSubmit} className="authform__form">
        <label className="authform__field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="authform__field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p className="authform__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="authform__submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Log in'}
        </button>
      </form>

      {googleEnabled && (
        <button
          type="button"
          className="authform__google"
          onClick={() => signIn('google', { callbackUrl: '/account' })}
        >
          Continue with Google
        </button>
      )}

      <p className="authform__switch">
        {mode === 'register' ? (
          <>
            Already have an account? <a href="/login">Log in</a>
          </>
        ) : (
          <>
            New to NaijaXch? <a href="/register">Sign up</a>
          </>
        )}
      </p>
    </div>
  );
}
