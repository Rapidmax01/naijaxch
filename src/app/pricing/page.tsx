import { auth } from '@/auth';
import { isPremium } from '@/billing';
import { UpgradeButton } from '@/web/components/billing/UpgradeButton';
import { Disclaimer } from '@/web/components/common/Disclaimer';

export const metadata = { title: 'Pricing — NaijaXch' };

const FREE = [
  'Trend charts: 1M / 3M / 6M / 1Y',
  'Watchlist & manual portfolio tracker',
  'Market heatmap',
  'Limited report cards',
];
const PREMIUM = [
  'Full trend history — 5Y / Max',
  'Portfolio-level trend',
  'Full screener',
  'Full report cards',
  'AI plain-English summaries',
];

export default async function PricingPage() {
  const session = await auth();
  const authed = Boolean(session?.user?.id);
  const premium = await isPremium();

  return (
    <div className="pricing">
      <h1 className="stock-page__title">Pricing</h1>
      <p className="stock-page__sector">
        Start free. Upgrade for full history, screeners, and AI summaries — 14-day trial.
      </p>

      <div className="pricing__cards">
        <section className="pricing__card">
          <h2>Free</h2>
          <p className="pricing__price">₦0</p>
          <ul>
            {FREE.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>

        <section className="pricing__card pricing__card--premium">
          <h2>Premium</h2>
          <p className="pricing__price">Naira / month</p>
          <ul>
            {PREMIUM.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {premium ? (
            <p className="pricing__active">You&apos;re on Premium ✓</p>
          ) : (
            <UpgradeButton authed={authed} label="Start 14-day trial" />
          )}
        </section>
      </div>

      <Disclaimer />
    </div>
  );
}
