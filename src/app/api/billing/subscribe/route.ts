/**
 * Start a Premium subscription checkout. Auth required. Returns a Paystack
 * hosted-checkout URL; the user pays on Paystack (we never see card details).
 * Tier is granted by the webhook, not here.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { billingEnabled, initSubscriptionCheckout } from '@/billing';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!billingEnabled()) {
    return NextResponse.json({ error: 'Billing is not configured yet.' }, { status: 503 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  try {
    const { authorizationUrl } = await initSubscriptionCheckout(
      session.user.email,
      `${base}/billing/callback`,
    );
    return NextResponse.json({ url: authorizationUrl });
  } catch {
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 502 });
  }
}
