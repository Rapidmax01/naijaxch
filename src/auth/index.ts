/**
 * src/auth — accounts (Auth.js / NextAuth v5).
 *
 * Email/password (Credentials) + optional Google, JWT sessions (Credentials
 * only supports JWT). The Prisma adapter is attached only when DATABASE_URL is
 * set, so the app builds/runs without a DB (the in-memory data path).
 *
 * GUARDRAIL G4: handles PII. Never log emails/hashes/tokens. Changes here need
 * human approval (CLAUDE.md #3).
 */

import NextAuth, { type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { getPrismaClient } from '@/data/prisma-store';
import { isValidEmail, normalizeEmail } from './validation';
import { verifyPassword } from './password';

const providers: NextAuthConfig['providers'] = [
  Credentials({
    name: 'Email and password',
    credentials: { email: {}, password: {} },
    authorize: async (raw) => {
      const email = typeof raw?.email === 'string' ? normalizeEmail(raw.email) : '';
      const password = typeof raw?.password === 'string' ? raw.password : '';
      if (!isValidEmail(email) || password.length === 0) return null;

      const user = await getPrismaClient().user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null; // no account, or OAuth-only

      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return null;

      return { id: user.id, email: user.email, name: user.name, tier: user.tier };
    },
  }),
];

// Google only when credentials are configured.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Adapter persists OAuth users; omitted without a DB so build/dev still work.
  adapter: process.env.DATABASE_URL ? PrismaAdapter(getPrismaClient()) : undefined,
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/login' },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as { tier?: string }).tier ?? 'free';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? '';
        session.user.tier = (token.tier as string) ?? 'free';
      }
      return session;
    },
  },
});
