import { ForgotPasswordForm } from '@/web/components/auth/ForgotPasswordForm';

export const metadata = { title: 'Reset password — NaijaXch' };

export default function ForgotPasswordPage() {
  return (
    <div className="auth-page">
      <h1 className="stock-page__title">Reset your password</h1>
      <p className="stock-page__sector">Enter your email and we&apos;ll send a reset link.</p>
      <ForgotPasswordForm />
      <p className="authform__switch">
        <a href="/login">Back to log in</a>
      </p>
    </div>
  );
}
