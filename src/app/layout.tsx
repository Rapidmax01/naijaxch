import type { Metadata } from 'next';
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthSessionProvider } from '@/web/components/auth/SessionProvider';
import { HeaderAuth } from '@/web/components/auth/HeaderAuth';
import { DISCLAIMER_TEXT } from '@/web/components/common/Disclaimer';

const sans = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NaijaXch — Fluid NGX trend analysis',
  description:
    'The first platform that makes NGX (Nigerian Exchange) trend analysis fluid. Research, tools, and community for Nigerian stocks. Delayed/end-of-day data.',
};

const NAV = [
  { href: '/', label: 'Markets' },
  { href: '/screener', label: 'Screener' },
  { href: '/heatmap', label: 'Heatmap' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/pricing', label: 'Pricing' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <AuthSessionProvider>
          <header className="site-header">
            <div className="site-header__inner">
              <a className="brand" href="/" aria-label="NaijaXch home">
                <span className="brand__mark" aria-hidden />
                <span className="brand__word">NaijaXch</span>
              </a>
              <nav className="site-nav" aria-label="Primary">
                {NAV.map((item) => (
                  <a key={item.href} href={item.href} className="site-nav__link">
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="site-header__auth">
                <HeaderAuth />
              </div>
            </div>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer">
            <div className="site-footer__inner">
              <div>
                <span className="brand__word">NaijaXch</span>
                <p className="site-footer__tag">Fluid NGX trend analysis — research, tools & community.</p>
              </div>
              <nav className="site-footer__nav" aria-label="Footer">
                {NAV.map((item) => (
                  <a key={item.href} href={item.href}>
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
            <p className="site-footer__legal">{DISCLAIMER_TEXT}</p>
          </footer>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
