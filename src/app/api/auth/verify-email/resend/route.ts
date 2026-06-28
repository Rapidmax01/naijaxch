/** Resend the verification email to the signed-in user. */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAndSendVerification } from '@/auth/verification';

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await createAndSendVerification(session.user.email);
  } catch {
    // swallow — don't log PII
  }
  return NextResponse.json({ ok: true });
}
