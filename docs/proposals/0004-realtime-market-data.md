# Proposal 0004 — Real-Time / Intraday Market Data (Phase 2)

**Status:** Draft for review (no code written) — **proposes leaving a Phase-1 scope lock**
**Author:** Claude + Obinna
**Date:** 2026-06-28
**Depends on:** Proposal 0001 (persistence), 0003 (billing — real-time is the natural Premium hook).
**Approval required before ANY build:**
- Scope-lock exception — "NO real-time market data at launch" (CLAUDE.md scope lock).
- G3 — real-time is a **separate, paid NGX licence tier**; never wire a tick feed without explicit human approval.
- New third-party data integration (CLAUDE.md #6).
- Anything touching billing/entitlement (#3) and the AI grounding inputs (#4).

> This document is a **plan and a checklist**, not an approval. Nothing here ships until you sign the scope-lock exception in §8. The licensing and compliance work (the hard 80%) is yours and counsel's; the engineering (the easy 20%) is scoped here so the decision is informed.

---

## 1. Scope & the hard boundary

Add **live (real-time or 15-min delayed) NGX quotes** as a **company-page quote surface** — a last-trade price + intraday change that updates without a page reload — gated as a Premium feature.

**What this is NOT (boundaries that survive into Phase 2):**
- **The trend chart stays end-of-day.** Per trend-engine rule **TS2**, multi-period charts plot the daily `adjClose` series. A live tick must NEVER redraw a 1Y/5Y chart — daily closes keep thinly-traded names clean and the chart honest. Real-time surfaces as a *quote badge*, not as chart data.
- **Still no execution, no order book depth as actionable, no advice (G2).** A live price makes the "information, not a recommendation" posture *more* sensitive, not less.
- **Still NGX-only, still no fund custody** (other scope locks unchanged).

Out of scope for this proposal: options/derivatives, full Level-2 depth-of-book, market-by-order, and any non-NGX venue.

---

## 2. The data tiers (why this is a licence decision, not a feature)

| Tier | Latency | Phase-1 status | Licence cost | This proposal |
|---|---|---|---|---|
| End-of-day | next day | ✅ in scope | lowest | chart stays here (TS2) |
| **Delayed** | 15 min | ✅ in scope | low | **recommended launch surface** |
| **Real-time** | sub-second tick | 🔒 scope-locked | highest, per-display-user | the upgrade, if approved |

The jump from delayed → real-time is the expensive one in **both** licence fees **and** obligations (§5). The recommendation in §7 is to ship the **delayed** badge first (already inside Phase-1 scope) and treat true real-time as a deliberate, separately-approved increment.

---

## 3. Architecture (what changes, what doesn't)

The layering rule holds: UI/AI read computed values from the source-of-truth layer; nothing re-fetches a raw feed ad hoc (G3).

```
NGX real-time/delayed feed (licensed)
        │  streaming transport (WebSocket/SSE) — NEW
        ▼
src/ingestion/  quote stream consumer (NEW, env-guarded)
        │  writes last-trade / intraday snapshot
        ▼
src/data/  source of truth
        ├─ EOD series  (unchanged — feeds the chart, TS2)
        └─ live quote  (NEW hot path: last price, ts, day change)  ← entitlement-gated
        ▼
src/api/  /quote/:ticker  (gated: Premium + entitled)
        ▼
src/web/  <LiveQuoteBadge>  (subscribes, shows delay/live state)
```

- **New:** a streaming consumer (NGX push or short-poll, per the vendor's transport), a `live_quotes` hot store keyed by ticker (last price, timestamp, intraday open/high/low, day change), and a `<LiveQuoteBadge>` that displays the price **with an explicit "Live" / "15-min delayed" label and the quote timestamp** (a licence + trust requirement).
- **Unchanged:** the trend engine, the adjusted EOD series, the rules engine, the AI pipeline's grounding inputs (the chart and report cards keep reading EOD — see §6).
- **TimescaleDB** already fits the time-series shape; this is an ingestion + entitlement + one component addition, not a rearchitecture.

---

## 4. Entitlement & gating (tighter than ordinary Premium)

Real-time licences are typically priced **per display user** and require you to **prove** who can see live data:
- Gate the live badge behind `isPremium(userId)` **and** a real-time entitlement flag — server-side only, never a client check.
- Free / non-entitled users see the **delayed** quote (or EOD), clearly labelled.
- Maintain a **display-user count** for NGX reporting (an auditable number, not just a feature flag).
- The 15-min delayed surface can be **open to all logged-in users** (cheap licence); true real-time becomes the Premium upgrade. This dovetails with Proposal 0003's `users.tier`.

---

## 5. Licensing & compliance checklist (the real gate — your + counsel's work)

Engineering is blocked on these, not the reverse:

- [ ] **Real-time distribution licence** signed with NGX (or a licensed redistributor). Separate agreement from EOD/delayed.
- [ ] **Per-display-user reporting** mechanism agreed and built into entitlement (§4).
- [ ] **Non-display / derived-data clause** reviewed. Feeding live prices into the **rules engine, report cards, or AI summaries** can count as separately-licensed "non-display use." **Default decision D-C: keep all derived/computed surfaces on EOD** so we don't trip this clause — only the on-screen badge is live.
- [ ] **Redistribution & caching terms** — how long we may store/cache a live quote, and whether we may serve it to our own API consumers.
- [ ] **Display obligations** — required "Live"/"Delayed" labelling, timestamp, and NGX attribution on every quote.
- [ ] **Regulatory posture** — confirm with counsel that a live-quote research product (no execution, no advice) does not pull us toward venue/broker obligations; re-confirm G2 advice boundaries with live data.
- [ ] **Data protection (G4)** — entitlement/usage reporting must not log PII; the display-user count is an aggregate.
- [ ] **Cost model approved** — licence + infra vs the Premium revenue it unlocks (§7 / Proposal 0003 pricing).

---

## 6. Guardrail impact (explicit)

| Guardrail | Impact | Handling |
|---|---|---|
| **Scope lock (real-time)** | This *is* the exception being requested | §8 sign-off required |
| **G1 / TS4 — numbers from data, not LLM** | Unchanged | live quote is computed from the feed, never narrated by the model |
| **G2 — no advice** | Heightened | copy review; a live price must not imply "act now" |
| **G3 — licensed, delayed default** | Directly amended | only with a signed real-time licence; delayed remains the safe default |
| **G6 / TS1 / TS2 — chart plots adjClose EOD** | **Unchanged — must not regress** | live ticks never touch the chart series; badge only |
| **AI grounding (#4)** | Keep inputs EOD | AI summaries continue reading EOD/computed values; no live numbers into prompts |

---

## 7. Recommendation

1. **Ship the 15-min delayed quote badge first.** It is already inside Phase-1 scope (G3 allows delayed), needs only the cheaper delayed licence, and delivers ~90% of the "live price" feel. Lowest cost, no scope-lock crossing.
2. **Treat true real-time as a separately-approved Phase-2 increment** — its own licence, its own Premium price point (Proposal 0003), and the §8 sign-off. Build it only when the licence is signed and the per-user reporting obligation is accepted.
3. **Never let either touch the trend chart.** Chart = EOD, always (TS2).

---

## 8. Decisions I need

- **D-A — Scope-lock exception:** do you approve, in principle, leaving the "no real-time" lock for a **gated live-quote badge only** (chart stays EOD)? Yes/no — nothing builds without this.
- **D-B — Tier to pursue first:** **delayed (15-min, in-scope now)** vs **real-time (needs licence + D-A)**. Recommend delayed first.
- **D-C — Derived-data boundary:** confirm computed surfaces (rules, report cards, AI) **stay on EOD** to avoid the non-display licence clause. Recommend yes.
- **D-D — Entitlement model:** delayed open to all logged-in users + real-time as Premium, vs all live data Premium-only.
- **D-E — Transport:** confirm against the chosen NGX/vendor feed (WebSocket push vs delayed short-poll) once a provider is selected.

---

*Plan only — not legal advice. The licence, per-display-user reporting, non-display clauses, and regulatory posture must be confirmed with NGX and counsel before any code is written.*
