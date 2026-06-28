'use client';

/** Header auth state — login/register links or the signed-in user + sign out. */
import { signOut, useSession } from 'next-auth/react';

export function HeaderAuth() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <span className="header-auth__loading" aria-hidden />;
  }

  if (session?.user) {
    return (
      <span className="header-auth">
        <a href="/account" className="header-auth__user">
          {session.user.email ?? 'Account'}
        </a>
        <button type="button" className="header-auth__link" onClick={() => signOut({ callbackUrl: '/' })}>
          Sign out
        </button>
      </span>
    );
  }

  return (
    <span className="header-auth">
      <a href="/login" className="header-auth__link">
        Log in
      </a>
      <a href="/register" className="header-auth__cta">
        Sign up
      </a>
    </span>
  );
}
