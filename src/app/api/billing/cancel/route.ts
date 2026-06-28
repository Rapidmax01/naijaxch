/**
 * Cancel the user's Premium subscription via Paystack. Premium stays active
 * until the period ends; Paystack then fires `subscription.disable`, and the
 * webhook flips the tier back to free.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrismaClient } from '@/data/prisma-store';
import { billingEnabled, disableSubscription, fetchSubscription } from '@/billing';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!billingEnabled()) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 503 });
  }

  const sub = await getPrismaClient().subscription.findUnique({
    where: { userId: session.user.id },
    select: { subscriptionCode: true },
  });
  if (!sub?.subscriptionCode) {
    return NextResponse.json({ error: 'No active subscription.' }, { status: 400 });
  }

  try {
    const details = await fetchSubscription(sub.subscriptionCode);
    if (!details.emailToken) throw new Error('missing email token');
    await disableSubscription(sub.subscriptionCode, details.emailToken);
    await getPrismaClient().subscription.update({
      where: { userId: session.user.id },
      data: { status: 'non-renewing' },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not cancel. Contact support.' }, { status: 502 });
  }
}
