<!-- Place at repo root as CLAUDE.md. Keep this file lean (<200 lines) so adherence stays high.
     Detailed module rules live in .claude/rules/. Full product spec lives in docs/ and is read on demand, not auto-imported. -->

# NaijaXch — Project Memory (Claude Code)

NaijaXch is **the platform that makes NGX (Nigerian Exchange) trend analysis fluid** — Robinhood-grade interactive charting for Nigerian stocks — surrounded by a research, tools, and community layer. Phase 1 only.
Full spec: read `docs/NaijaXch-Phase1-Build-Spec.md` when you need detail. Do not duplicate it here.

## What this product IS

**Centerpiece:** a fast, interactive trend-analysis experience (tappable timeframes, drag-to-read scrub, color-by-period) built on a clean, corporate-action-adjusted, end-of-day daily price series per NGX name.
**Around it:** company pages, fundamentals, screeners, watchlists, portfolio tracking (incl. portfolio-level trend), automated report cards, AI-written plain-English summaries, and community — for NGX-listed companies.

## What this product is NOT (scope lock — do not build these in Phase 1)

- **NO trade execution / order routing.** We are not a broker. Never add buy/sell order placement.
- **NO holding or moving customer funds.** No wallets, no balances, no settlement.
- **NO personalised investment advice.** General information only (see Guardrails).
- **NO US / foreign securities.** NGX only.
- **NO real-time market data at launch.** Delayed / end-of-day only (licensing — see Guardrails).
- **NO native mobile apps yet.** Responsive web first.

> IMPORTANT: If a task implies any of the above, STOP and ask the human before writing code. These are legal/regulatory boundaries, not preferences.

---

## GUARDRAILS (non-negotiable)

### G1 — Numbers never come from the language model
**IMPORTANT: Every numeric figure shown to a user MUST be computed deterministically from source data. The LLM may only narrate figures that have already been computed and validated. NEVER let the model produce, estimate, or "fill in" a number.** Hallucinated figures on a stock page are a trust-ending failure. Full rules load from `.claude/rules/ai-pipeline.md` when you touch the AI/rules-engine code.

### G2 — General information, never personalised advice
Across UI copy, AI prompts, report cards, and community features:
- ALLOWED: "The data shows dividend cover below 1." / "Trades below its 5-year average P/E." / "High-yield NGX names."
- FORBIDDEN: "You should buy this." / "Right for your portfolio." / any individualised recommendation.
- Every report card and AI summary MUST render the disclaimer: *"Automated, general information — not personalised advice."*

### G3 — Market data is licensed and delayed
- Displaying NGX data to users requires an NGX distribution licence. Phase 1 uses **delayed (30-min) or end-of-day** data only.
- NEVER wire a real-time/tick feed without explicit human approval — it is a separate, paid licence tier.
- Keep a single data-source-of-truth layer; UI and AI read computed values from it, never re-fetch raw feeds ad hoc.

### G4 — Data protection (NDPA / NDPC)
- Treat all user data (accounts, portfolios, later CSCS data) as regulated PII.
- NEVER log PII, secrets, or full portfolio holdings to application logs or error trackers.
- Process only what a feature needs; document lawful basis for new data collection before building it.

### G5 — Secrets
NEVER put API keys, tokens, DB credentials, or environment-specific values in code, CLAUDE.md, or committed files. Use environment variables and `.env` (git-ignored).

### G6 — Charts use the adjusted series, never raw prices
**IMPORTANT: Multi-period trend charts MUST plot the corporate-action-adjusted series (`adjClose`) from `src/series/`, never raw historical `close`.** Plotting raw prices renders every bonus/rights/split ex-date as a fake cliff and makes the chart lie. The series engine back-adjusts once on ingest and stores `adjClose`; the chart component receives a ready series and never fetches or adjusts. Every applied adjustment is recorded for audit. Unit-test each adjustment factor against a known-good fixture before it reaches a chart.

---

## Architecture map (where things live)

<!-- Update these paths to match the actual repo once scaffolded. -->

- `src/ingestion/`   — scheduled jobs: price poller (delayed/EOD), filings poller + PDF parser, corporate-actions sync.
- `src/data/`        — the **single source of truth**: structured store for raw prices, fundamentals, statements, corporate actions, reference data.
- `src/series/`      — **trend engine**: builds the adjusted, gap-free daily `PriceSeries`; applies corporate-action back-adjustment; serves windowed series to the chart. (See spec §5.)
- `src/rules/`       — deterministic **rules engine**: metric calculations → scores/flags → report-card data.
- `src/ai/`          — **AI summary service**: grounded generation + validation gate (see `.claude/rules/ai-pipeline.md`).
- `src/api/`         — backend API (stock pages, screener, watchlists, portfolio, community).
- `src/web/`         — responsive frontend + the interactive trend chart (timeframes, scrub, portfolio trend).
- `src/auth/`, `src/billing/` — accounts + freemium paywall + naira subscription collection (via payments provider).
- `docs/`            — product spec and ADRs. Read on demand.

**Layering rule:** the chart receives a ready `PriceSeries` from `src/series/` — it does NOT fetch or adjust. UI and AI read computed values from `src/series/`, `src/data/`, and `src/rules/`. Business/data logic NEVER lives in API route handlers or React components.

---

## Stack & commands

- Stack: **Next.js 14 (App Router) + React 18 + TypeScript (strict)**. Single `src/` tree (see Architecture map). Money math via **decimal.js**. Source of truth: **PostgreSQL + TimescaleDB** (DB wiring deferred — see below). Tests: **Vitest**.
- Install: `npm install`
- Dev: `npm run dev`
- Test: `npm test`  — **run before committing.**
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- DB migrations: Postgres/TimescaleDB **not yet wired** — `src/data/` ships an in-memory, fixture-backed store. Adding the DB + migrations **requires human approval (see below).**

> Next.js note: routing lives in `src/app/` (thin pages + `src/app/api/.../route.ts` handlers that delegate to `src/api/`). Reusable UI — including the trend chart — lives in `src/web/`. Handlers and components hold no data/business logic (layering rule).

## Conventions

- TypeScript, strict mode. 2-space indentation.
- Money/quantities: use integer minor units or a decimal library — NEVER floating-point arithmetic for prices, holdings, or P&L.
- Every computed metric has a unit test with a known-good fixture before it powers a report card.

---

## Human approval required (do NOT do autonomously)

1. Anything touching the scope-lock list above (execution, funds, advice, US stocks, real-time data, native apps).
2. Database schema changes / migrations.
3. Changes to auth, billing, or anything handling money or PII.
4. Changes to the AI grounding or validation-gate logic in `src/ai/`.
5. Changes to the corporate-action adjustment logic in `src/series/` (a wrong factor silently corrupts every chart).
6. Deploys, and any new third-party data or service integration.
7. Adding or loosening a disclaimer, or changing advice-boundary copy (G2).

---

## Working style

- Keep changes small and reviewable. State assumptions inline.
- When unsure whether something crosses a guardrail, ask — do not guess.
- Read `docs/NaijaXch-Phase1-Build-Spec.md` for full feature scope before building a new area.
