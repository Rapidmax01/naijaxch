/**
 * Account-bound portfolio holdings API (auth required). GET returns the saved
 * holdings; PUT replaces the whole set (the builder autosaves the full list).
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getHoldings, replaceHoldings, type AccountHolding } from '@/api';

const MAX_HOLDINGS = 200;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ holdings: await getHoldings(session.user.id) });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { holdings?: unknown } | null;
  const holdings: AccountHolding[] = Array.isArray(body?.holdings)
    ? body!.holdings
        .filter(
          (h): h is { ticker: string; quantity: number } =>
            typeof h === 'object' &&
            h !== null &&
            typeof (h as Record<string, unknown>).ticker === 'string' &&
            typeof (h as Record<string, unknown>).quantity === 'number',
        )
        .slice(0, MAX_HOLDINGS)
    : [];

  await replaceHoldings(session.user.id, holdings);
  return NextResponse.json({ ok: true });
}
