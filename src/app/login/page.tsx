import { AuthForm } from '@/web/components/auth/AuthForm';

export const metadata = { title: 'Log in — NaijaXch' };

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return (
    <div className="auth-page">
      <h1 className="stock-page__title">Log in</h1>
      <p className="stock-page__sector">Access your watchlist and portfolio.</p>
      <AuthForm mode="login" googleEnabled={googleEnabled} />
      <p className="authform__switch">
        <a href="/forgot-password">Forgot your password?</a>
      </p>
    </div>
  );
}
