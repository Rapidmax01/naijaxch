/**
 * Moderation API (proposal 0008) — admin only. GET lists the open report queue;
 * POST resolves a report (hide / remove / dismiss). Thin handler; admin check +
 * actions live in src/api. Dark unless COMMUNITY_ENABLED is set (D-F).
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { communityEnabled, isAdminUser, listModerationQueue, moderate } from '@/api';

async function requireAdmin() {
  if (!communityEnabled()) return { error: 'Not found', status: 404 as const };
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401 as const };
  if (!(await isAdminUser(session.user.id))) return { error: 'Forbidden', status: 403 as const };
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });
  return NextResponse.json({ queue: await listModerationQueue() });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const body = (await request.json().catch(() => null)) as { reportId?: unknown; action?: unknown } | null;
  const action = body?.action;
  if (typeof body?.reportId !== 'string' || (action !== 'hide' && action !== 'remove' && action !== 'dismiss')) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const ok = await moderate(body.reportId, action);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
