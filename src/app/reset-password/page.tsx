import { ResetPasswordForm } from '@/web/components/auth/ResetPasswordForm';

export const metadata = { title: 'Set a new password — NaijaXch' };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; id?: string };
}) {
  return (
    <div className="auth-page">
      <h1 className="stock-page__title">Set a new password</h1>
      <ResetPasswordForm id={searchParams.id ?? ''} token={searchParams.token ?? ''} />
    </div>
  );
}
