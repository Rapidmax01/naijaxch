/** Complete a password reset with a valid token. */

import { NextResponse } from 'next/server';
import { passwordIssues } from '@/auth/validation';
import { resetPassword } from '@/auth/reset';

interface Body {
  id?: unknown;
  token?: unknown;
  password?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const id = typeof body?.id === 'string' ? body.id : '';
  const token = typeof body?.token === 'string' ? body.token : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!id || !token) {
    return NextResponse.json({ error: 'Invalid reset link.' }, { status: 400 });
  }
  const issues = passwordIssues(password);
  if (issues.length > 0) {
    return NextResponse.json({ error: issues.join(' ') }, { status: 400 });
  }

  const ok = await resetPassword(id, token, password);
  if (!ok) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
