import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NaijaXch — Fluid NGX trend analysis',
  description:
    'The first platform that makes NGX (Nigerian Exchange) trend analysis fluid. Research, tools, and community for Nigerian stocks. Delayed/end-of-day data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a className="site-header__brand" href="/">
            NaijaXch
          </a>
          <span className="site-header__tag">Fluid NGX trend analysis</span>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
