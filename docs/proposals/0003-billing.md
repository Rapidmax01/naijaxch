# Proposal 0003 — Freemium Billing (Step 5, Paystack)

**Status:** Draft for review (no code written)
**Author:** Claude + Obinna
**Date:** 2026-06-28
**Depends on:** Proposal 0002 (auth — `users.tier` already exists).
**Approval required before building:** anything handling money (CLAUDE.md #3); new third-party integration (#6).

---

## 1. Scope & the hard boundary

Add a **Premium tier** collected as a naira subscription, gating the premium features in the spec's freemium split (§7). **NaijaXch never holds or moves customer funds** (scope lock): a licensed payments provider (**Paystack**) holds the money and runs the charge; we store only **subscription status**, mirrored from Paystack via webhooks. `users.tier` (`free`/`premium`) flips based on that status — nothing else.

Out of scope: refunds tooling beyond what Paystack provides, invoicing, multi-currency, in-app wallets (never — scope lock).

---

## 2. Free vs Premium (from spec §7)

| Capability | Free | Premium |
|---|---|---|
| Trend chart timeframes | 1M / 3M / 6M / 1Y | **+ 5Y / Max** |
| Portfolio-level trend | — | ✅ |
| Screener | basic (or teaser) | ✅ full |
| Report cards | limited | ✅ full |
| AI summaries | — | ✅ |
| Watchlist / portfolio tracker | ✅ | ✅ |
| Market heatmap | ✅ | ✅ |
| Data | delayed/EOD | delayed/EOD (same tier — real-time is a separate licence, G3) |

Gating is **server-side** (the source of truth is `users.tier`), with the UI showing upgrade prompts on gated surfaces. Never gate behind client-only checks.

> Decision **D-A** below pins the exact free/premium line — the table is the spec's default.

---

## 3. Schema additions (new migration — human-run via `migrate deploy`)

`users.tier` already exists. Add a `subscriptions` table mirroring Paystack state:

| Table | Key columns | Notes |
|---|---|---|
| `subscriptions` | `id`, `user_id` FK (unique), `provider` (`paystack`), `customer_code`, `subscription_code`, `plan_code`, `status` (`active`/`non-renewing`/`cancelled`/`past_due`), `current_period_end`, `created_at`, `updated_at` | One active sub per user. Provider is the source of truth for payment; this is a mirror. |

No card data, no PANs — Paystack holds all of it (PCI stays with them). We store only codes + status (treat as low-sensitivity, but still no logging of full rows; G4).

---

## 4. Flow

**Subscribe:**
1. User clicks Upgrade → server creates/looks up a Paystack **customer** for the user, initializes a **transaction** (or subscription) for the naira plan → returns the Paystack checkout URL.
2. User pays on Paystack's hosted page (we never see card details).
3. Paystack redirects back to a `/billing/callback` page (verify transaction server-side) **and** fires a webhook.

**Webhook (source of truth):**
- `POST /api/billing/webhook` verifies the `x-paystack-signature` HMAC-SHA512 against the raw body using the secret key.
- On `charge.success` / `subscription.create` → set `users.tier = premium`, upsert `subscriptions`.
- On `subscription.disable` / `subscription.not_renew` / failed renewal → set `tier = free` (at `current_period_end`).
- Idempotent (dedupe by event id/reference); webhooks can retry.

**Cancel:** call Paystack to disable the subscription; tier stays premium until `current_period_end`, then flips on the webhook.

**Gate enforcement:** a server helper `requirePremium(session)` / `isPremium(userId)` reads `users.tier`; gated API routes and server components check it; the trend engine's 5Y/Max windows and the AI/screener/report surfaces consult it.

---

## 5. Security / compliance

- **Secrets (G5):** `PAYSTACK_SECRET_KEY` in env only; public key for the inline/checkout init. Never commit, never log.
- **Webhook verification:** reject any payload whose HMAC doesn't match the raw body (same raw-body care as the Brevo/auth work).
- **No fund custody (scope lock):** we only read status. If a feature ever implies holding/moving money, STOP.
- **PII (G4):** don't log subscription rows or customer codes wholesale.
- **Disclaimers unchanged (G2):** paying doesn't change the "general information, not advice" posture.
- Confirm the merchant/settlement setup and any CBN/consumer-protection terms with counsel before launch (spec §10 spirit).

---

## 6. Build sequence (once approved)

1. `subscriptions` migration (you review + run).
2. Paystack client (init transaction, verify, create/disable subscription) — env-guarded like the AI/email clients.
3. Webhook route (signature verify + idempotent tier updates) + `isPremium` helper. Pure signature-verify + status-mapping logic unit-tested.
4. Server-side gating on the premium surfaces (5Y/Max, portfolio trend, screener, full report cards, AI summaries) + `UpgradePrompt` UI.
5. Pricing page + Upgrade button + `/billing/callback` + account-page subscription status/cancel.

Each step stays within billing/PII; pure logic (signature verify, webhook→tier mapping, gate checks) is unit-tested. Real charges need live Paystack keys (yours to add).

---

## 7. Decisions I need

- **D-A — Free/premium line:** accept the §7 table above as-is, or adjust (e.g. should the screener be fully free, or teaser-only?).
- **D-B — Price:** the naira monthly amount (e.g. ₦X/month). Also: monthly only, or monthly + discounted annual?
- **D-C — Paystack model:** Paystack **Plans + Subscriptions** (recurring, auto-renew) vs **manual monthly transactions** (you re-initialize). Recommend Plans/Subscriptions for true recurring.
- **D-D — Free trial?** none / 7-day / 14-day.
- **D-E — Gate style for free users on premium surfaces:** hard block (locked page + upgrade CTA) vs teaser (blurred/partial data + CTA). Recommend teaser for charts/screener, hard block for AI summaries.

---

*Plan only — not legal/financial advice. Confirm settlement, merchant, and consumer-protection terms before launch.*
