# Proposal 0008 — Community Layer (per-company discussion)

**Status:** Draft for review (no code written)
**Author:** Claude + Obinna
**Date:** 2026-06-29
**Depends on:** Proposal 0002 (auth — `User` exists), 0003 (billing — `users.tier`).
**Approval gates that apply (several — this is the most guardrail-heavy area):**
- **#2** — new tables (posts, reports). Human-run migration.
- **#3** — handles user data / PII (G4) and is auth-bound.
- **#7** — NEW disclaimer + advice-boundary copy (community guidelines). G2.
- **#6** — none (no third-party) unless we add an LLM moderator (then **#4** too — out of scope here).

> Plan only. Community is **"Fast-follow"** in the spec, not MVP — so this scopes a deliberately small, safe first slice. Nothing builds until the decisions in §8 are signed off, especially the copy (#7) and a legal check (D-F).

---

## 1. Why moderation leads, not the feature

A forum about specific NGX tickers is, by default, a magnet for **investment advice, hype, and pump-and-dump / market manipulation**. Our whole product posture is "general information, never advice" (G2) and "we are not a broker." User-generated content (UGC) puts *other people's* advice on our pages. So the design question isn't "how do we let people post" — it's **"how do we host opinion without (a) implying we endorse it, (b) becoming a manipulation venue, or (c) leaking PII."**

Everything below is shaped by that. If the moderation/disclaimer/legal pieces aren't acceptable, we don't ship the posting box.

---

## 2. Scope — a small, safe first slice

**In:** a per-company discussion thread on the stock page. Logged-in users post short plain-text "takes"; everyone can read; posts can be reported; an admin can hide/remove; rate limits + length limits + a basic blocklist.

**Out (deferred):** replies/threading depth, up/down voting, following contributors, diaspora hooks, notifications, rich media/links, DMs, reputation. (All "later" per the spec's fast-follow framing.)

This mirrors the spec's freemium split: **read = everyone; posting is gated** (D-A).

---

## 3. Guardrails for UGC (the core of this proposal)

- **G2 — opinions, clearly not advice or ours.** Every thread renders a standing notice: *"Community posts are individual opinions — not advice, and not NaijaXch's view. Do not treat them as a recommendation."* Distinct from our own *"Automated, general information"* disclaimer.
- **Community guidelines (new copy, #7)** prohibit: investment advice/solicitation, pump-and-dump or any market manipulation, spam/ads, abuse/harassment, sharing personal/contact data, and anything unlawful. Posting requires accepting them.
- **We never amplify or endorse.** No "top take," no AI-written posts, no algorithmic promotion of advice. Newest-first or simple chronological.
- **G4 / PII.** Show a **display name only** — never email. Never log post bodies with identifiers into app logs/error trackers. Document NDPA lawful basis (legitimate interest / consent at posting). A user can delete their own posts; account deletion removes/anonymises them (ties into the existing account-delete path).
- **G1 stays ours, not theirs.** Users may type numbers in opinions (we can't compute those) — so posts are **clearly attributed to the user and visually separated** from our computed figures, and never mixed into report cards, AI grounding, or the chart. A user's number is never presented as a NaijaXch figure.

---

## 4. Moderation model (reactive MVP — D-C)

1. **Pre-publish (cheap, deterministic):** length cap (e.g. 1–500 chars), per-user **rate limit** (e.g. N posts / 10 min), and a small **blocklist** for obvious spam/contact patterns (URLs, phone/WhatsApp, emails). No LLM arbiter (that would pull in #4).
2. **Report → review:** any logged-in user can flag a post with a reason; it lands in a moderation queue.
3. **Admin action:** an authorised admin can **hide** (soft) or **remove** a post; hidden posts show a tombstone. Minimal admin surface to start.
4. **Audit:** moderation actions recorded (who/when/why) for accountability — no PII beyond the actor id.

Escalation policy (repeat offenders, bans) is a fast-follow once volume justifies it.

---

## 5. Schema (new migration — #2, human-run)

| Table | Key columns | Notes |
|---|---|---|
| `community_post` | `id`, `ticker` FK→company, `user_id` FK→user, `body` (≤500 chars), `status` (`visible`/`hidden`/`removed`), `created_at`, `edited_at?` | One row per post. Flat (no parent) for MVP. |
| `post_report` | `id`, `post_id` FK, `reporter_id` FK→user, `reason`, `status` (`open`/`actioned`/`dismissed`), `created_at` | Dedupe one report per user per post. |

Indexes on `(ticker, created_at desc)` and `post_report(status)`. No new PII columns beyond the FK to `user`. Cascade/anonymise on user deletion (G4).

---

## 6. Architecture (layering rule holds)

```
src/data      community store: createPost / listPosts(ticker) / reportPost / setPostStatus  (+ Prisma + in-memory fixtures)
src/api       community service: auth check, rate-limit, length + blocklist validation, tier gate
src/app/api   thin routes: POST /api/community/[ticker], POST /api/community/report, admin status route
src/web       <CommunityThread> (read for all; composer for entitled users) on the stock page + a minimal mod queue page
```

- Validation (length, blocklist, rate-limit math) is **pure and unit-tested** before it gates a post.
- Posting routes require a verified session; the admin route requires an admin role (new — D-E).
- Reads can be cached briefly; writes are not.

---

## 7. Guardrail impact

| Guardrail | Impact | Handling |
|---|---|---|
| G2 — no advice | **High** (UGC = others' advice) | guidelines + per-thread notice (#7); no amplification; report/remove |
| G1 — our numbers | Unchanged | user posts visually separated; never enter report card / AI / chart |
| G4 — PII | **High** | display name only; no PII in logs; deletion path; lawful basis |
| #2 — schema | Two tables | human-run migration |
| #3 — auth/money | Auth-bound | verified session to post; tier gate (D-A) |
| #7 — disclaimer/advice copy | **New copy** | guidelines + notice need your sign-off |
| Manipulation / SEC posture | New risk | anti-manipulation rule + reporting; **legal review (D-F)** |

---

## 8. Decisions I need

- **D-A — Who can post:** spec default is **free = read-only, premium = post**. Engagement argues for *any verified user posts, premium gets extras*. Pick one. (Read is always open.)
- **D-B — Threading:** flat takes (recommended MVP) vs one level of replies.
- **D-C — Moderation:** reactive (report→admin) + rate-limit + blocklist for MVP (recommended) vs add proactive filtering now.
- **D-D — Identity:** display name from the account (recommended) vs a separate community handle; any pseudonymity?
- **D-E — Admin role:** add an `isAdmin`/role flag to `User` (small migration) and who holds it.
- **D-F — Legal (blocking):** confirm UGC liability stance, anti-manipulation obligations, and NDPA lawful basis/guidelines wording **with counsel** before launch. This gates go-live, not the build of the safe slice.
- **D-G — Copy (#7):** approve the community-guidelines + per-thread notice wording (I'll draft for review).

---

## 9. Build sequence (once approved)

1. Migration: `community_post` + `post_report` (+ admin flag, D-E) — you review/run.
2. `src/data` community store (Prisma + in-memory fixtures) + pure validation (length, blocklist, rate-limit) — unit-tested.
3. `src/api` community service (auth, tier gate, validation) + thin routes.
4. `<CommunityThread>` (read + gated composer) on the stock page, with the per-thread notice + guidelines link.
5. Minimal moderation: report action + an admin queue page with hide/remove.
6. Account-deletion hook to remove/anonymise posts (G4).

Each step keeps validation pure + tested; nothing user-authored ever reaches our computed surfaces (G1).

---

*Plan only — not legal advice. Hosting UGC about securities carries liability, market-manipulation, and data-protection obligations; confirm with counsel (D-F) before launch. The posting box does not ship without the moderation, disclaimer, and legal pieces in place.*
