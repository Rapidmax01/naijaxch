# Proposal 0005 — Delayed Quote Badge (≥15-min, in-scope)

**Status:** Draft for review (no code written)
**Author:** Claude + Obinna
**Date:** 2026-06-28
**Depends on:** Proposal 0001 (data layer), existing `MarketDataSource` adapter + `SourceOfTruth`.
**Relationship to 0004:** This is the **in-scope** half of the live-price question. Proposal 0004 (real-time) needs a scope-lock exception; **this one does not** — see §1.

**Approval gates that apply:**
- **No scope-lock exception needed.** The spec mandates "launch on delayed/EOD" (spec §1, §9); G3 explicitly permits **delayed (30-min) or EOD**. The existing `NgxMarketDataSource` already whitelists the `delayed` tier (`ALLOWED_TIERS = {eod, delayed}`).
- **#6 (new third-party integration)** — applies only at **go-live with real NGX credentials**. The scaffold runs env-guarded against fixtures until then (same pattern as the existing NGX adapter), so building it wires no live feed.
- **#2 (schema/migration)** — applies only if we **persist** quotes (§4, Decision D-B). Avoidable for v1.

---

## 1. Why this is inside Phase-1 scope

The scope lock forbids **real-time / tick** data. A **delayed** quote (NGX's 30-min, or a ≥15-min tier) is a different, cheaper licence that the product is **designed to launch on** — the spec calls it "the cheapest NGX data tier (delayed/EOD), the one we launch on anyway." So the badge crosses no boundary; it just surfaces one extra computed value (an intraday last price + timestamp) that the licensed delayed feed already carries.

**The one firm line (unchanged from 0004): the trend chart stays EOD (TS2).** The delayed quote is a *badge on the company page only*. It never touches the adjusted `PriceSeries` or redraws a chart.

---

## 2. What the user sees

On the company page heading, next to the name/ticker:

```
GTCO  ₦42.85  ▲ +0.95 (+2.27%)   ·  15-min delayed · as of 14:32 WAT
```

- Last price + intraday change (abs + %), coloured up/down like the chart.
- An **explicit, always-on delay label + timestamp** — this is both a licence display obligation (G3) and the existing disclaimer requirement ("data delayed", spec §9). Never show a bare number that could read as live.
- Loading skeleton; graceful "—" when no quote is available (market closed / pre-open / unlicensed fixture mode).
- The page-level "Automated, general information — not personalised advice" disclaimer (G2) is unchanged and still rendered.

---

## 3. Architecture (mostly reuse — the seams already exist)

```
NGX delayed feed (licensed) ──┐  env-guarded (NGX_DATA_API_BASE + key, tier=delayed)
                              ▼
src/ingestion/sources/        MarketDataSource.fetchDelayedQuote(ticker)   ← NEW method
  ├─ ngx-source.ts            real adapter (delayed tier already allowed)
  └─ fixture-source.ts        synthesises a quote from the latest EOD point  ← NEW
                              ▼
src/data/                     SourceOfTruth.getQuote(ticker): DelayedQuote   ← NEW
                              ▼
src/api/                      getDelayedQuote(ticker)  (delegates; formats; TS3)
                              ▼  /app/api/quote/[ticker]/route.ts (thin)
src/web/                      <DelayedQuoteBadge>  (client; polls on an interval)
```

New domain type:

```ts
interface DelayedQuote {
  ticker: Ticker;
  price: number;        // last delayed trade
  change: number;       // vs previous close
  changePct: number;
  asOf: string;         // ISO timestamp of the quote
  delayMinutes: number; // e.g. 15 or 30 — drives the label
}
```

- **Numbers stay deterministic (G1/TS4):** computed from the feed, rounded in `src/api` (TS3), never narrated by the LLM. The AI pipeline's grounding inputs stay on EOD (no live numbers into prompts).
- **Layering rule honoured:** the badge reads a computed `DelayedQuote` from `src/api`/`src/data`; it never fetches the raw feed.
- **Refresh:** the badge polls `/api/quote/:ticker` on an interval (e.g. every 60s — a *display* refresh, not a tick stream). No WebSocket; this is delayed data.

---

## 4. Storage & freshness (Decision D-B)

A delayed quote is small and short-lived. Two options:

- **v1 — no persistence (recommended).** The API route fetches the latest delayed quote on demand with a short in-process **cache TTL** (e.g. 60s) to respect the feed's rate limits. **No migration, no #2 gate.**
- **v2 — `quotes` hot table.** If we later want history/auditing or many readers, add a one-row-per-ticker `quotes` table (a migration you run). Defer until needed.

Either way, in fixture mode (no licence) the quote is synthesised from the latest stored EOD close so the UI is fully demoable offline.

---

## 5. Guardrail impact

| Guardrail | Impact | Handling |
|---|---|---|
| Scope lock (real-time) | **None** — delayed ≠ real-time | tier pinned to `delayed`; adapter already refuses real-time |
| G3 — licensed/delayed | Directly satisfied | env-guarded; mandatory delay label + timestamp |
| G1 / TS4 — numbers from data | Unchanged | quote computed from feed, rounded; never from LLM |
| G2 — no advice | Unchanged | badge is a price, not a call to act; disclaimer stays |
| G6 / TS1 / TS2 — chart = EOD | **Must not regress** | quote is badge-only; never enters `PriceSeries` |
| AI grounding (#4) | Unchanged | AI keeps reading EOD/computed values; no live numbers in prompts |
| G4 — PII | None | quotes carry no user data |

---

## 6. Build sequence (once you OK this scope)

Safe to build **now**, fixture-backed, no live feed, no migration:

1. `DelayedQuote` type + `fetchDelayedQuote` on `MarketDataSource`; fixture source synthesises from latest EOD. **Pure mapping unit-tested.**
2. `SourceOfTruth.getQuote` (in-memory + Prisma paths) + `src/api/getDelayedQuote` (formatting/rounding, TS3). **Formatter + change-calc unit-tested.**
3. `/app/api/quote/[ticker]/route.ts` (thin) + 60s cache.
4. `<DelayedQuoteBadge>` on the company page (delay label + timestamp + skeleton + "—" empty state).

Gated on the licence (you + NGX), done later:

5. Confirm `ngx-mapping` field shape for the delayed-quote endpoint against NGX's real API; set `NGX_DATA_TIER=delayed` + credentials. Go-live = the **#6** integration step.

Each step lives in the data/ingestion/api/web layers per the layering rule; pure logic (mapping, change %, label formatting) is unit-tested with known-good fixtures.

---

## 7. Decisions I need

- **D-A — Build the fixture-backed scaffold now?** Yes → I implement steps 1–4 against synthetic delayed quotes (fully in-scope, no live feed, no migration), and it lights up for real when you add the licensed credentials. No → keep it as a scoped plan only.
- **D-B — Persistence:** v1 on-demand + 60s cache (recommended) vs a `quotes` table (migration, #2).
- **D-C — Delay label wording:** "15-min delayed" vs "30-min delayed" vs "Delayed" — must match whatever the signed licence actually grants (use the real tier).
- **D-D — Free vs Premium:** is the delayed badge **open to all** (cheap licence, broad value) or a Premium teaser? (Recommend open to all logged-in users; reserve *real-time* for Premium per 0004.)
- **D-E — Refresh interval:** 60s display poll (recommended) vs manual refresh button.

---

*Plan only — not legal advice. Confirm the exact delayed tier, display-obligation wording, and rate limits against the signed NGX licence before go-live.*
