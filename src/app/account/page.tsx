import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPrismaClient } from '@/data/prisma-store';
import { AccountActions } from '@/web/components/auth/AccountActions';
import { UpgradeButton } from '@/web/components/billing/UpgradeButton';
import { CancelButton } from '@/web/components/billing/CancelButton';

export const metadata = { title: 'Account — NaijaXch' };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // emailVerified + tier aren't reliable in the JWT; read from the source of truth.
  let emailVerified = true;
  let tier = session.user.tier ?? 'free';
  if (process.env.DATABASE_URL) {
    const user = await getPrismaClient().user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true, tier: true },
    });
    emailVerified = Boolean(user?.emailVerified);
    tier = user?.tier ?? 'free';
  }
  const premium = tier === 'premium';

  return (
    <div className="account-page">
      <h1 className="stock-page__title">Account</h1>
      <dl className="account-page__details">
        <div>
          <dt>Email</dt>
          <dd>{session.user.email}</dd>
        </div>
        <div>
          <dt>Plan</dt>
          <dd className="account-page__tier">
            {premium ? 'Premium' : 'Free'}
            <span className="account-page__plan-action">
              {premium ? <CancelButton /> : <UpgradeButton authed label="Upgrade" />}
            </span>
          </dd>
        </div>
      </dl>

      <AccountActions emailVerified={emailVerified} />
    </div>
  );
}
