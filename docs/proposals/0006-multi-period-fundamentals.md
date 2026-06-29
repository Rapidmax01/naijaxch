# Proposal 0006 — Multi-Period Fundamentals & Growth Metrics

**Status:** Draft for review (no code written)
**Author:** Claude + Obinna
**Date:** 2026-06-29
**Depends on:** Proposal 0001 (data layer); the rules engine (`src/rules`) and trend engine (`src/series`).
**Approval gates that apply:**
- **#2 (schema/migration)** — *mostly avoided*, see §2. The fundamentals table already holds many periods; only a (optional) index is a real migration.
- **#4 (AI grounding)** — only if growth metrics are fed to AI summaries. **This proposal does NOT do that** (§6); that stays a separate, gated step.
- New historical-data ingestion is a data-source expansion (#6) at go-live.

> Plan and checklist only. Nothing builds until you accept the decisions in §8.

---

## 1. Scope & the boundary

Today the report card reads a **single** reporting period. This adds a **history** of periods per company so we can compute **growth** (revenue / EPS / dividend YoY) and one trend-valuation flag ("trades below its multi-year average P/E"). All figures stay **computed deterministically** (G1) and framed as **general information** (G2) — growth context, never "buy because it's growing."

Out of scope: forecasts/projections (we never predict numbers — G1), analyst estimates, quarterly intra-year seasonality modelling (annual periods first).

---

## 2. The pleasant surprise: little/no schema change

The Prisma `Fundamentals` model is already keyed `@@id([ticker, period])` — it can store **many periods per ticker right now**. The single-period limitation lives in three avoidable places, not the table:

1. **Access:** `getFundamentals(ticker)` returns one row (`findFirst orderBy period desc`).
2. **Fixtures:** `SAMPLE_FUNDAMENTALS` is `Record<Ticker, Fundamentals>` — one period each.
3. **Seed/ingestion:** only the latest period is populated.

So the work is: **add a history accessor, seed multiple periods, compute growth** — not a table redesign.

| Change | Migration? |
|---|---|
| `getFundamentalsHistory(ticker): Fundamentals[]` (new method; keep `getFundamentals` = latest) | No |
| Seed ~5 fiscal years per fixture company | No (data only) |
| Optional index `(ticker, period DESC)` for query speed | Trivial migration — **Decision D-B** |

That keeps gate #2 to, at most, one optional index you run — a far smaller ask than a redesign.

---

## 3. Data-access shape

```ts
// src/data — SourceOfTruth
getFundamentals(ticker): Promise<Fundamentals | null>          // unchanged (latest)
getFundamentalsHistory(ticker): Promise<Fundamentals[]>        // NEW — ascending by period
```
- In-memory store: back `SAMPLE_FUNDAMENTALS` with `Record<Ticker, Fundamentals[]>` (ascending); `getFundamentals` returns the last element.
- Prisma store: `findMany({ where:{ticker}, orderBy:{ period:'asc' } })`.
- `period` stays a string label (`FY2021`…); ordering is lexical on `FY####`, which sorts correctly. (If we ever mix interim/annual, add an explicit order key — out of scope now.)

---

## 4. New metrics (rules engine — deterministic, unit-tested)

A new `src/rules/growth.ts`, pure like `report-card.ts` (decimal.js, rounded TS3):

| Metric | Formula | Needs |
|---|---|---|
| Revenue growth (YoY) | (revₜ − revₜ₋₁) / revₜ₋₁ | ≥2 periods |
| EPS growth (YoY) | (epsₜ − epsₜ₋₁) / epsₜ₋₁ | ≥2 periods |
| Dividend growth (YoY) | (dpsₜ − dpsₜ₋₁) / dpsₜ₋₁ | ≥2 periods |
| Revenue 3-yr CAGR | (revₜ / revₜ₋ₙ)^(1/n) − 1 | ≥4 periods |
| Return on equity (ROE) | netIncome / totalEquity | 1 period (included for completeness) |

- **Status policy (G2-sensitive — Decision D-C):** default = growth metrics are **informational/neutral**; we only attach a *factual* note on a clear signal ("Revenue fell year-on-year."). We do NOT colour growth as "good/bad" in a way that implies a recommendation. EPS-from-a-loss and divide-by-near-zero are guarded (null, like the existing engine).

---

## 5. The marquee flag: "below its N-year average P/E" (Phase B)

The spec's explicit G2-allowed example. Combines **history × trend**:
1. For each past period, pair its **EPS** with the **adjusted price** at that period's end (from `src/series` — adjClose, G6/TS1).
2. Historical P/E per period = price / EPS (positive earnings only).
3. Average them; compare to the **current** P/E → "Trades ~X% below its 5-year average P/E."

This is error-prone (date alignment between fiscal period-end and a trading day; sparse history). **Implement it explicitly and unit-test against a fixture** — same discipline as the corporate-action factors. Hence it's **Phase B**, after the simpler YoY growth lands.

---

## 6. Where it surfaces — and what it does NOT touch

- **Report card:** a new **"Growth"** sub-section (YoY deltas, ROE) under the existing metrics, plus the trend-valuation line in Phase B. General information; standing disclaimer unchanged (no #7).
- **Screener (optional later):** revenue/EPS-growth columns + filters, once the data exists.
- **AI summaries — explicitly unchanged.** `buildFacts` keeps reading only the current-period metrics; growth figures do **not** enter AI prompts in this proposal. Feeding them to the model is a separate change behind gate #4.
- **Trend chart — unchanged** (EOD adjClose; TS2). History feeds the rules engine, not the chart series.

---

## 7. Guardrail impact

| Guardrail | Impact | Handling |
|---|---|---|
| #2 schema | Minimal — table already multi-period | new accessor + seed; optional index (D-B) |
| G1 / TS3 — computed, rounded | Unchanged | growth math in decimal.js, unit-tested |
| G2 — general info, no advice | Heightened (growth tempts advice tone) | informational status policy (D-C); factual notes only |
| #4 — AI grounding | Not crossed | growth excluded from AI prompts (§6) |
| G6 / TS1 / TS2 — chart EOD | Unchanged | Phase-B P/E history reads the series read-only; chart untouched |
| Data quality | New risk: sparse/missing periods | every metric returns null when periods are insufficient |

---

## 8. Decisions I need

- **D-A — History depth:** seed/ingest how many fiscal years (recommend **5**, to support 3-yr CAGR + a 5-yr P/E average)?
- **D-B — Index:** add the `(ticker, period DESC)` index (one tiny migration) or rely on the small row counts for now? (Recommend defer until real data volume.)
- **D-C — Growth status policy:** informational-only (recommended, safest for G2) vs allow `watch` on declines (e.g. revenue down YoY).
- **D-D — Phase B now or later:** include the "below N-year average P/E" flag in this build, or ship YoY growth first and do the P/E-history flag as a follow-up? (Recommend **YoY first**.)
- **D-E — Real data source:** historical financials via NGX historical-fundamentals product or the filings backfill — confirm which, and the years available, before go-live (#6).

---

## 9. Build sequence (once approved)

**Phase A (no migration):**
1. `getFundamentalsHistory` on both stores; fixtures → multi-period (5 yrs synthetic, ascending).
2. `src/rules/growth.ts` — YoY revenue/EPS/dividend, ROE, optional CAGR. Pure, unit-tested vs known-good fixtures.
3. Report-card "Growth" sub-section + a `<GrowthMetrics>` render. Disclaimer unchanged.

**Phase B (optional, D-D):**
4. Period-end ↔ series-date alignment helper + historical-P/E-vs-average flag. Heavily unit-tested.

**Later / separate gates:**
5. Screener growth columns + filters (no gate).
6. Growth into AI summaries — **separate #4 sign-off**.
7. Real historical-fundamentals ingestion — **#6** at go-live.

---

*Plan only — not financial advice. Growth figures are historical, computed, general information; confirm the historical-data licence/source before go-live.*
