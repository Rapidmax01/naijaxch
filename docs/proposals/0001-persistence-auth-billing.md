# Proposal 0001 — Persistence, Auth & Billing

**Status:** Approved direction; Step 1 (DB foundation) scaffolded — migrations not yet run
**Author:** Claude + Obinna
**Date:** 2026-06-27
**Approval required before building:** DB schema/migrations · auth · billing (CLAUDE.md "Human approval required" #2, #3).

**Decisions taken:** D1 Prisma (v6, classic config) · D2 (auth) deferred to its step · D3 compute-on-read + cache · D4 Paystack · D5 start with DB swap only.

**Step 1 done (scaffold only):** Prisma schema for market-data tables, hypertable SQL, `PrismaSourceOfTruth` behind the existing interface, seed script, local `docker-compose`. The store falls back to the in-memory fixtures when `DATABASE_URL` is unset, so nothing is user-visibly changed until you run the (human-run) migrations. Follow-up when DB-backed: data-reading pages may need `force-dynamic`/revalidate since they currently prerender from fixtures at build.

**Step 2 done:** ingestion pipeline (`src/ingestion`) — `MarketDataSource` interface, `MarketDataWriter` interface + Prisma writer (idempotent upserts), pure validate/clean layer, `runIngestion()` orchestration, `npm run ingest`. Source is the **fixture source** (placeholder) until the licensed NGX delayed/EOD feed is wired; `NgxMarketDataSource` is a stub marking that gated seam (G3). Tested via a fake writer (no DB needed).

**Step 3 done:** auth — see proposal 0002 (all sub-steps complete, verified on live DB).

**Step 4 done:** account-bound portfolios. Single `holdings` table per user (simpler than the multi-portfolio model sketched in §2.1 — sufficient for the MVP manual tracker). `holdings` migration applied via `migrate deploy` (init had drift from the manually-run TimescaleDB hypertable, so deploy was used to avoid a reset). `PortfolioBuilder` loads/autosaves to the account when signed in, client-only otherwise. Verified end-to-end.

> TimescaleDB note: the hypertable was created outside Prisma's migration history, so `migrate dev` reports drift. Use `migrate deploy` for new migrations, or fold the hypertable SQL into a migration later to remove the drift.

---

## 1. Why now

The app currently reads everything from an **in-memory fixture store** (`src/data/store.ts`). Every engine (trend, rules, screener, heatmap) and surface (charts, portfolio, watchlist) already reads through the `SourceOfTruth` interface, so swapping the implementation for a real database is a contained change — *if* we get the schema right. Watchlists and portfolios are currently browser-local; making them account-bound needs auth, which needs a user store, which needs the DB. This proposal sequences all three.

**Scope discipline (unchanged):** no execution, no custody of funds, no advice, NGX-only, delayed/EOD data (CLAUDE.md scope lock). Billing **collects subscription naira via a licensed provider** — NaijaXch never holds or moves customer funds.

---

## 2. Database: PostgreSQL + TimescaleDB

One Postgres instance. The only TimescaleDB-specific object is the daily price **hypertable**; everything else is ordinary relational data.

### 2.1 Schema (first cut)

**Reference / market data** (source of truth — populated by `src/ingestion`):

| Table | Key columns | Notes |
|---|---|---|
| `companies` | `ticker` (PK), `name`, `sector`, `shares_outstanding`, `listed_on` | Reference data. |
| `raw_prices` | `ticker` (FK), `date`, `close` `NUMERIC(18,4)`, `volume` `BIGINT` | **TimescaleDB hypertable**, partitioned on `date`. PK `(ticker, date)`. Raw/unadjusted (audit). |
| `corporate_actions` | `id`, `ticker` (FK), `ex_date`, `type`, `terms` `JSONB` | Feeds the adjustment engine. `terms` shape per action type. |
| `fundamentals` | `ticker` (FK), `period`, `revenue`, `net_income`, `share_count`, `dividend_per_share`, `total_equity`, `total_debt` | All `NUMERIC`. PK `(ticker, period)`. Raw inputs only — ratios stay computed (G1). |

**Derived price series** — two options (decision **D3** below):
- (a) Compute `adjClose` on read from `raw_prices` + `corporate_actions` and cache in app/Redis; or
- (b) Materialize an `adjusted_prices` hypertable, recomputed when a corporate action lands.

**Accounts & user data** (regulated PII — G4):

| Table | Key columns | Notes |
|---|---|---|
| `users` | `id` (UUID PK), `email` (citext, unique), `password_hash`, `created_at`, `tier` | `password_hash` = Argon2id. Never log rows. |
| `sessions` | `id`, `user_id` (FK), `expires_at`, `created_at` | If we use DB sessions (see D2). |
| `watchlist_items` | `user_id` (FK), `ticker`, `added_at` | PK `(user_id, ticker)`. Replaces/augments localStorage. |
| `portfolios` | `id`, `user_id` (FK), `name` | |
| `holdings` | `id`, `portfolio_id` (FK), `ticker`, `quantity` `NUMERIC` | Manual entry. No cost-basis custody, just tracking. |
| `subscriptions` | `id`, `user_id` (FK), `provider`, `provider_ref`, `status`, `current_period_end` | Mirror of provider state; provider is source of truth for payment. |

**Money columns:** always `NUMERIC`, never `float`/`double precision` — matches the decimal.js rule end to end.

### 2.2 Numbers & the guardrails

- `raw_prices.close`, `fundamentals.*`, `holdings.quantity`, money everywhere → `NUMERIC`. The app already uses decimal.js; this keeps precision across the wire.
- `adjClose` and all ratios remain **computed** by `src/series` / `src/rules` (G1) — the DB stores inputs (and optionally a cache), never LLM output.
- No PII (emails, holdings) in application logs or error trackers (G4). Add a logging redaction allowlist.

---

## 3. Migration tooling

TimescaleDB needs `CREATE EXTENSION` + `create_hypertable()` — raw SQL that most ORMs don't model natively. Two viable paths:

- **Prisma** for the typed client + relational migrations, with the TimescaleDB hypertable created via a hand-written SQL migration (Prisma supports custom/`--create-only` SQL). Best DX; one caveat to manage.
- **Drizzle** (SQL-first) — more natural for raw SQL/extensions, lighter, TS-native; smaller ecosystem.

**Recommendation:** Prisma for the relational model + one raw-SQL migration for the hypertable/extension. Either way, **migrations are reviewed and run by a human** (CLAUDE.md #2) — I draft, you approve and run.

---

## 4. Auth

Phase-1 minimum: email + password accounts gating premium features.

- **Hashing:** Argon2id (or bcrypt) — never store plaintext.
- **Sessions:** httpOnly, SameSite cookies. Either DB-backed sessions or a vetted library (e.g. Auth.js/NextAuth, Lucia). Library reduces footguns.
- **PII / NDPA (G4):** collect only email + auth necessities; document lawful basis before adding any field; redact from logs; support account deletion.
- **No third-party data leakage:** auth state never sent to the AI layer.

Changes here need human approval (CLAUDE.md #3).

---

## 5. Billing (freemium, naira)

- **Tiers:** Free (delayed/EOD, basic timeframes, limited reports, read-only community) vs Premium (full data + history, portfolio trend, screeners, full report cards + AI summaries) — per spec §7.
- **Provider:** a licensed Nigerian payments provider (e.g. **Paystack**) handles card/bank collection in naira. **NaijaXch never touches funds** — the provider holds the money; we store only subscription *status* mirrored via webhooks.
- **Webhooks:** verify signatures; treat provider as source of truth for payment state.
- Changes here need human approval (CLAUDE.md #3) and must keep the scope lock (no custody).

---

## 6. Suggested sequence (each step gated)

1. **DB foundation** — stand up Postgres+TimescaleDB locally (Docker), Prisma schema + hypertable migration, implement a `PrismaSourceOfTruth` behind the existing `SourceOfTruth` interface. Seed with the current sample data. *No app behaviour changes — pure swap.*
2. **Ingestion stubs → real** — wire `src/ingestion` to write `raw_prices` / `corporate_actions` / `fundamentals` (still delayed/EOD; real NGX feed is its own gated integration, G3).
3. **Auth** — accounts + sessions; migrate watchlist from localStorage to `watchlist_items` (keep localStorage as anonymous fallback).
4. **Account-bound portfolios** — persist holdings.
5. **Billing** — tiers + Paystack subscription + webhook; gate premium features.

Steps 1, 3, 5 each return to you for explicit approval (schema/migration, auth, money).

---

## 7. Decisions I need from you

- **D1 — ORM:** Prisma (recommended) vs Drizzle.
- **D2 — Auth:** library (Auth.js/Lucia, recommended) vs hand-rolled sessions.
- **D3 — Adjusted series:** compute-on-read + cache (recommended, simpler, correct-by-construction) vs materialized `adjusted_prices` hypertable (faster reads, more invalidation logic).
- **D4 — Payments provider:** Paystack (assumed) vs Flutterwave vs other.
- **D5 — Scope of step 1:** do you want me to start with *just* the DB swap (lowest risk, no user-facing change) before anything auth/billing?

---

*This is a plan, not legal advice. Confirm NGX data-licence terms and the advice boundary with a Nigerian capital-markets lawyer before launch (spec §10).*
