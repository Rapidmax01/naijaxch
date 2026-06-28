import { AuthForm } from '@/web/components/auth/AuthForm';
import { Disclaimer } from '@/web/components/common/Disclaimer';

export const metadata = { title: 'Sign up — NaijaXch' };

export default function RegisterPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return (
    <div className="auth-page">
      <h1 className="stock-page__title">Create your account</h1>
      <p className="stock-page__sector">
        Free to start — delayed/EOD data, watchlist, and portfolio tracking.
      </p>
      <AuthForm mode="register" googleEnabled={googleEnabled} />
      <Disclaimer />
    </div>
  );
}
