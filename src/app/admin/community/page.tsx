import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { communityEnabled, isAdminUser } from '@/api';
import { ModerationQueue } from '@/web/components/community/ModerationQueue';

export const metadata = { title: 'Community moderation — NaijaXch' };
export const dynamic = 'force-dynamic';

export default async function CommunityModerationPage() {
  if (!communityEnabled()) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!(await isAdminUser(session.user.id))) notFound();

  return (
    <div className="admin-page">
      <h1 className="stock-page__title">Community moderation</h1>
      <p className="stock-page__sector">
        Open reports, oldest first. Hiding shows a tombstone; removing takes the post down. Actions
        are recorded.
      </p>
      <ModerationQueue />
    </div>
  );
}
