/**
 * Paystack webhook — the source of truth for subscription status. Verifies the
 * HMAC signature over the RAW body, then idempotently flips `users.tier` and
 * mirrors the subscription. Never logs the payload or secrets (G4/G5).
 */

import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/data/prisma-store';
import { classifyPaystackEvent, verifyPaystackSignature } from '@/billing';

interface PaystackEvent {
  event?: string;
  data?: {
    customer?: { email?: string; customer_code?: string };
    subscription_code?: string;
    plan?: { plan_code?: string };
    next_payment_date?: string;
  };
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? '';
  const raw = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!verifyPaystackSignature(raw, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(raw) as PaystackEvent;
  const action = classifyPaystackEvent(payload.event ?? '');
  if (action === 'noop') return NextResponse.json({ ok: true });

  const email = payload.data?.customer?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: true }); // nothing to map

  const db = getPrismaClient();
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ ok: true }); // unknown customer — ack & ignore

  if (action === 'activate') {
    await db.user.update({ where: { id: user.id }, data: { tier: 'premium' } });
    await db.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: 'active',
        customerCode: payload.data?.customer?.customer_code,
        subscriptionCode: payload.data?.subscription_code,
        planCode: payload.data?.plan?.plan_code,
        currentPeriodEnd: payload.data?.next_payment_date
          ? new Date(payload.data.next_payment_date)
          : null,
      },
      update: {
        status: 'active',
        subscriptionCode: payload.data?.subscription_code ?? undefined,
        currentPeriodEnd: payload.data?.next_payment_date
          ? new Date(payload.data.next_payment_date)
          : undefined,
      },
    });
  } else {
    // deactivate
    await db.user.update({ where: { id: user.id }, data: { tier: 'free' } });
    await db.subscription.updateMany({
      where: { userId: user.id },
      data: { status: 'cancelled' },
    });
  }

  return NextResponse.json({ ok: true });
}
