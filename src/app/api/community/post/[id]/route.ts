/**
 * Delete the viewer's own community post (proposal 0008, G4 — users control
 * their content). Soft-removes; only the author can delete their post.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { communityEnabled, deleteOwnPost } from '@/api';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!communityEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const removed = await deleteOwnPost(params.id, session.user.id);
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
