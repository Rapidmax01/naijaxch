'use client';

/**
 * CommunityThread (proposal 0008) — per-company discussion.
 *
 * Reads for everyone; verified members post (D-A). Always renders the
 * "opinions, not advice, not NaijaXch's view" notice (G2). User posts are
 * visually separated and never mixed with our computed panels (G1). Shows a
 * display name only — never an email (G4).
 */

import { useEffect, useState } from 'react';
import type { CommunityPost } from '@/api';
import { MAX_POST_LENGTH, REPORT_REASONS } from '@/api/community-rules';

const REASON_LABEL: Record<string, string> = {
  advice: 'Investment advice / a buy-sell tip',
  manipulation: 'Market manipulation / pump-and-dump',
  spam: 'Spam, ad, or promotion',
  abuse: 'Abuse or harassment',
  'personal-info': 'Shares personal/contact info',
  other: 'Other',
};

const REJECT_MESSAGE: Record<string, string> = {
  empty: 'Write something first.',
  'too-long': `Posts are limited to ${MAX_POST_LENGTH} characters.`,
  'blocked-content': "For your safety, posts can't include links or contact details.",
  'rate-limited': "You're posting too quickly. Please wait a moment and try again.",
  unverified: 'Verify your email to post.',
  'premium-required': 'Posting is a Premium feature.',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CommunityThread({ ticker, company }: { ticker: string; company: string }) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [canPost, setCanPost] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/community/${ticker}`);
    if (!res.ok) {
      setLoaded(true);
      return;
    }
    const data = (await res.json()) as { posts: CommunityPost[]; canPost: boolean; signedIn: boolean };
    setPosts(data.posts);
    setCanPost(data.canPost);
    setSignedIn(data.signedIn);
    setLoaded(true);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  async function submit() {
    setError(null);
    const res = await fetch(`/api/community/${ticker}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: draft }),
    });
    if (res.status === 201) {
      setDraft('');
      await load();
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(REJECT_MESSAGE[data.error ?? ''] ?? 'Could not post. Please try again.');
  }

  async function remove(id: string) {
    await fetch(`/api/community/post/${id}`, { method: 'DELETE' });
    await load();
  }

  async function report(id: string, reason: string) {
    await fetch('/api/community/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: id, reason }),
    });
    setReporting(null);
  }

  const over = draft.length > MAX_POST_LENGTH;

  return (
    <section className="community" aria-label={`${company} community discussion`}>
      <header className="community__head">
        <h2 className="community__title">Community</h2>
      </header>

      <p className="community__notice" role="note">
        Posts are users&rsquo; personal opinions — <strong>not advice, and not NaijaXch&rsquo;s
        view</strong>. Don&rsquo;t act on them. Figures inside posts are users&rsquo; own; only data
        in NaijaXch&rsquo;s own panels is computed and checked by us.
      </p>

      {canPost ? (
        <div className="community__composer">
          <textarea
            className="community__input"
            placeholder={`Share a general observation about ${company} — no buy/sell calls.`}
            value={draft}
            maxLength={MAX_POST_LENGTH + 50}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
          />
          <div className="community__composer-foot">
            <span className={`community__count${over ? ' is-over' : ''}`}>
              {draft.length}/{MAX_POST_LENGTH}
            </span>
            <button
              type="button"
              className="btn btn--primary"
              disabled={draft.trim().length === 0 || over}
              onClick={submit}
            >
              Post
            </button>
          </div>
          {error && <p className="community__error">{error}</p>}
        </div>
      ) : (
        <p className="community__gate">
          {signedIn ? 'Verify your email to join the discussion.' : (
            <>
              <a href="/login">Sign in</a> to join the discussion. Anyone can read it below.
            </>
          )}
        </p>
      )}

      {!loaded ? (
        <p className="community__empty">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="community__empty">No posts yet. Remember — no buy/sell calls.</p>
      ) : (
        <ul className="community__list">
          {posts.map((p) => (
            <li key={p.id} className={`community__post${p.status !== 'visible' ? ' is-hidden' : ''}`}>
              {p.status !== 'visible' ? (
                <p className="community__tombstone">This post was removed for breaking the Community Guidelines.</p>
              ) : (
                <>
                  <div className="community__post-head">
                    <span className="community__author">{p.author}</span>
                    <span className="community__time">{timeAgo(p.createdAt)}</span>
                  </div>
                  <p className="community__body">{p.body}</p>
                  <div className="community__post-actions">
                    {p.mine ? (
                      <button type="button" className="community__action" onClick={() => remove(p.id)}>
                        Delete
                      </button>
                    ) : signedIn ? (
                      reporting === p.id ? (
                        <span className="community__report">
                          {REPORT_REASONS.map((r) => (
                            <button
                              key={r}
                              type="button"
                              className="community__report-reason"
                              onClick={() => report(p.id, r)}
                            >
                              {REASON_LABEL[r]}
                            </button>
                          ))}
                          <button type="button" className="community__action" onClick={() => setReporting(null)}>
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button type="button" className="community__action" onClick={() => setReporting(p.id)}>
                          Report
                        </button>
                      )
                    ) : null}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
