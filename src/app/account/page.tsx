import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const metadata = { title: 'Account — NaijaXch' };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

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
      <p className="stock-page__sector">
        Password reset, account deletion, and account-bound watchlist/portfolio are coming next
        (Step 3b / 4).
      </p>
    </div>
  );
}
