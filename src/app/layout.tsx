import type { Metadata } from 'next';
import './globals.css';
import { AuthSessionProvider } from '@/web/components/auth/SessionProvider';
import { HeaderAuth } from '@/web/components/auth/HeaderAuth';

export const metadata: Metadata = {
  title: 'NaijaXch — Fluid NGX trend analysis',
  description:
    'The first platform that makes NGX (Nigerian Exchange) trend analysis fluid. Research, tools, and community for Nigerian stocks. Delayed/end-of-day data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          <header className="site-header">
            <a className="site-header__brand" href="/">
              NaijaXch
            </a>
            <span className="site-header__tag">Fluid NGX trend analysis</span>
            <span className="site-header__spacer" />
            <HeaderAuth />
          </header>
          <main className="site-main">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
