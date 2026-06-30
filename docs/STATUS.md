# NaijaXch — Phase 1 Status

_Last updated: 2026-06-30 · ~235 tests passing · CI green · all changes via reviewed PRs_

NaijaXch makes NGX trend analysis fluid — Robinhood-grade interactive charting for Nigerian stocks, with research, tools, and community around it. **No trade execution, no customer funds, no advice, NGX-only, delayed/EOD data.**

> **One caveat that applies to everything below:** the app currently runs on **deterministic synthetic fixtures**, not real NGX data. No figure shown today is a real quote or filing. Going live means signing the NGX data licences and flipping config — the code is wired and waiting (see _Gated_).

---

## ✅ Built & green

| Area | What's there |
|---|---|
| **Trend chart** (centerpiece) | Tappable timeframes incl. **5Y/Max**, drag-to-scrub with OHLC readout, **candlesticks**, MA 50/200 · EMA 20 · **Bollinger Bands**, **RSI/MACD** oscillator panel, volume sub-panel. Plots corporate-action-adjusted EOD prices (never raw). |
| **Screener** | Sector/valuation/yield filters + **growth & valuation** (Rev YoY · ROE · P/E-vs-average) + a **liquidity** flag, plus one-click named screens. |
| **Report cards** | Deterministic metrics + a status tally, **1-year price context**, **growth metrics**, **"trades below its N-year average P/E"**, and **sector-relative** context. |
| **AI summaries** | Plain-English narration that **never authors a number** — a validation gate substitutes computed, checked figures and rejects advice. Now also narrates growth/valuation. |
| **Company page extras** | Delayed/EOD **quote badge**, **Filings & news** (official NGX disclosures, link-out), corporate actions. |
| **Market** | Heatmap/pulse, watchlists, manual portfolio tracker **+ portfolio-level trend**. |
| **Accounts & access** | Auth (email + verification), freemium tiers, **Paystack** subscription billing (we never hold funds — provider does), NDPA-aware account deletion. |
| **Community** | Per-company discussion + reporting + admin moderation queue — **built but switched OFF** (see _Gated_). |

Data/infra: single source-of-truth layer, corporate-action **adjustment engine** (unit-tested factors), Postgres + TimescaleDB via Prisma (idempotent dev seed), GitHub Actions CI on every PR, protected `master`.

---

## 📝 Scoped (planned, not yet built)

Design docs in `docs/proposals/`, each pending sign-off:

- **0004 — Real-time / intraday data** (Phase 2). Separate paid NGX licence; would surface as a *live quote badge only* — the chart stays EOD. Needs a scope-lock exception.
- **0009 — News, beyond disclosures.** Third-party media (headline + link-out, copyright-bound) and macro (CBN/NBS) are deferred; the disclosures slice is built.

---

## 🔒 Gated — needs a human decision before go-live

These are **business/legal steps, not engineering** — the code is built and env-guarded behind them:

1. **Real NGX data licences (#6).** Delayed/EOD prices, historical fundamentals, and the disclosure feed. Today: synthetic fixtures. Sign the licence → set credentials → real data flows through the existing adapters.
2. **Community launch.** Needs a **legal review** (UGC liability, market-manipulation posture, NDPA) + approval of the community-guidelines copy, then flip `COMMUNITY_ENABLED`. Built and dark until then.
3. **Real-time data.** A separate, pricier licence + a deliberate scope-lock exception (0004).

---

## Guardrails held throughout
Numbers are always computed deterministically, never by the AI (**G1**). General information, never personalised advice (**G2**). Delayed/EOD only — no real-time without sign-off (**G3**). PII protected; never logged (**G4**). Charts plot the adjusted series, never raw prices (**G6**).

## Run it locally
`npm install` · `npm run db:up` (or `docker start naijaxch-db`) · `npm run db:migrate` · `npm run db:seed` · `npm run dev`. Tests: `npm test`.
