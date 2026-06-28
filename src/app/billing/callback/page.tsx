export const metadata = { title: 'Payment — NaijaXch' };

/**
 * Paystack redirect target after checkout. Premium is granted by the webhook
 * (the source of truth), so this page just reassures the user; access activates
 * within moments of the webhook landing.
 */
export default function BillingCallbackPage() {
  return (
    <div className="auth-page">
      <h1 className="stock-page__title">Thanks — payment received</h1>
      <p className="stock-page__sector">
        Your Premium access activates as soon as we confirm the payment (usually within a few
        seconds). Refresh your account page if it hasn&apos;t updated yet.
      </p>
      <p className="authform__switch">
        <a href="/account">Go to account</a>
      </p>
    </div>
  );
}
