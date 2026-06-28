import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPrismaClient } from '@/data/prisma-store';
import { AccountActions } from '@/web/components/auth/AccountActions';

export const metadata = { title: 'Account — NaijaXch' };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // emailVerified isn't in the JWT; read it from the source of truth.
  let emailVerified = true;
  if (process.env.DATABASE_URL) {
    const user = await getPrismaClient().user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });
    emailVerified = Boolean(user?.emailVerified);
  }

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
          <dd className="account-page__tier">{session.user.tier === 'premium' ? 'Premium' : 'Free'}</dd>
        </div>
      </dl>

      <AccountActions emailVerified={emailVerified} />
    </div>
  );
}
