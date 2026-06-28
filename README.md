# NaijaXch

**The platform that makes NGX (Nigerian Exchange) trend analysis fluid** — Robinhood-grade interactive charting for Nigerian stocks, surrounded by a research, tools, and community layer. Phase 1.

> Not a broker. No trade execution, no customer funds, no personalised advice, NGX-only, delayed/EOD data, responsive web. See `CLAUDE.md` for the full guardrails and `docs/NaijaXch-Phase1-Build-Spec.md` for the product spec.

## Stack

- **Next.js 14 (App Router)** + **React 18** + **TypeScript (strict)**
- **decimal.js** for all money/price math (never native floats)
- **PostgreSQL + TimescaleDB** as the source of truth *(wiring deferred — Phase-1 scaffold uses an in-memory fixture store)*
- **Vitest** for unit tests
- **Tailwind CSS**

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values; never commit real secrets
npm run dev                  # http://localhost:3000
npm test                     # run the trend-engine unit tests
```

Open `/` for the sample company list, or `/stocks/GTCO` to see the fluid trend chart
(GTCO carries a sample bonus issue, so raw vs. adjusted differ).

## Architecture (`src/`)

| Module | Responsibility |
|---|---|
| `app/` | Next.js routes — thin pages + `app/api/.../route.ts` handlers |
| `web/` | Reusable UI; the **TrendChart** (centerpiece) lives here |
| `series/` | **Trend engine** — adjusted EOD series, corporate-action adjustment, windowing, portfolio aggregation |
| `data/` | Single source of truth (raw prices, corporate actions, reference) |
| `api/` | Backend service layer (handlers delegate here) |
| `rules/` | Deterministic rules engine *(stub)* |
| `ai/` | Grounded AI summaries + validation gate *(stub)* |
| `ingestion/` | Price/filings/corporate-action pollers *(stub)* |
| `auth/`, `billing/` | Accounts + freemium paywall *(stubs)* |

**Layering rule:** the chart receives a ready `PriceSeries` from `src/series/` — it never fetches or adjusts. UI and AI read computed values from `src/series/`, `src/data/`, `src/rules/`. No data/business logic in route handlers or components.

## Guardrails (see `CLAUDE.md`)

- **G1** — numbers are computed deterministically; the LLM only narrates.
- **G6 / trend engine** — charts plot `adjClose` (adjusted), never raw `close`.
- Money math uses decimal.js; every adjustment factor is unit-tested.

The previous crypto-tooling site was removed in a clean-slate rebuild; its history remains in git.
