/** Email verification link target. Redirects to a friendly result page. */

import { NextResponse } from 'next/server';
import { normalizeEmail } from '@/auth/validation';
import { verifyEmailToken } from '@/auth/verification';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const email = normalizeEmail(url.searchParams.get('email') ?? '');
  const base = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  const ok = token && email ? await verifyEmailToken(email, token) : false;
  return NextResponse.redirect(`${base}/account?verified=${ok ? '1' : '0'}`);
}
