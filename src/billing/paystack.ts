/**
 * Paystack API client (env-guarded). Initializes the hosted checkout for the
 * naira subscription plan and verifies/cancels subscriptions. We never see card
 * details — Paystack hosts payment. Secret key in env only (G5).
 *
 * Plan + amount are configured in the Paystack dashboard and referenced via
 * PAYSTACK_PLAN_CODE (price decided there, not in code).
 */

const BASE = 'https://api.paystack.co';

export function billingEnabled(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PLAN_CODE);
}

function secret(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

async function paystack<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret()}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || body.status === false) {
    throw new Error(`Paystack ${path} failed: ${res.status} ${body.message ?? ''}`);
  }
  return body.data as T;
}

export interface CheckoutInit {
  authorizationUrl: string;
  reference: string;
}

/** Start a subscription checkout for the configured plan. Returns a hosted URL. */
export async function initSubscriptionCheckout(
  email: string,
  callbackUrl: string,
): Promise<CheckoutInit> {
  const data = await paystack<{ authorization_url: string; reference: string }>(
    '/transaction/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        plan: process.env.PAYSTACK_PLAN_CODE,
        callback_url: callbackUrl,
      }),
    },
  );
  return { authorizationUrl: data.authorization_url, reference: data.reference };
}

export interface VerifiedTransaction {
  status: string;
  customerCode?: string;
  subscriptionCode?: string;
}

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const data = await paystack<{
    status: string;
    customer?: { customer_code?: string };
  }>(`/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' });
  return { status: data.status, customerCode: data.customer?.customer_code };
}

export interface PaystackSubscription {
  status: string;
  emailToken?: string;
  nextPaymentDate?: string;
}

export async function fetchSubscription(code: string): Promise<PaystackSubscription> {
  const data = await paystack<{ status: string; email_token?: string; next_payment_date?: string }>(
    `/subscription/${encodeURIComponent(code)}`,
    { method: 'GET' },
  );
  return {
    status: data.status,
    emailToken: data.email_token,
    nextPaymentDate: data.next_payment_date,
  };
}

/** Disable a subscription (cancel). Needs the subscription code + email token. */
export async function disableSubscription(code: string, emailToken: string): Promise<void> {
  await paystack('/subscription/disable', {
    method: 'POST',
    body: JSON.stringify({ code, token: emailToken }),
  });
}
