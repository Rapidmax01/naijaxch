# Proposal 0009 — Company Disclosures & News Feed

**Status:** Draft for review (no code written)
**Author:** Claude + Obinna
**Date:** 2026-06-29
**Depends on:** the ingestion layer (`src/ingestion/` — the spec already plans a "filings poller + PDF parser"), 0001 (data layer), 0002 (company pages).
**Approval gates that apply:**
- **#6** — new third-party data integration (NGX disclosure feed; any media licensing). Go-live only.
- **#2** — new tables (disclosures, news items). Human-run migration.
- **#4** — ONLY if we AI-summarise news/filings. **This proposal does not** (§5); that stays a separate, gated step.
- **#7** — none, unless we add new advice-adjacent copy (we keep it factual).

> Plan only. "News" is three different sources with very different risk; this leads with the safe, high-value one (official disclosures) and draws the copyright line for the rest. Nothing builds until §8 is signed off, and no real feed is wired without your go-ahead (#6).

---

## 1. "Investment news" is three sources, not one

| Source | What | Risk | Verdict |
|---|---|---|---|
| **NGX official disclosures** | Company filings: results, dividends, board/material events, corporate actions (NGX X-Compliance / disclosure system) | Low — official regulatory disclosure, attaches to a company | **Primary — build first** |
| **Third-party media** | Nairametrics, Proshare, BusinessDay, Stears, etc. | **Copyright-gated** (§3) | Headlines + link-out only |
| **Macro / regulatory** | CBN (rates, FX), NBS (inflation, GDP), SEC Nigeria | Low — public/government | Context, later |

The first is the one the architecture already anticipates and the one we can show *in full* — it's not someone's copyrighted article, it's the company's own regulatory filing.

---

## 2. Scope

**In (Phase 1 slice):** a **per-company "Filings & news"** section on the stock page — official NGX disclosures for that ticker (title, type, date, link to the filing), plus optionally a few **tagged third-party headlines** as link-outs.

**Out (deferred):** a global news river, full-text article hosting, AI news summaries, sentiment scoring, push/email alerts on filings, macro dashboards. (All later.)

---

## 3. The copyright boundary (the real gate for media)

Official disclosures are the company's regulatory filings — we may store and display them in full, with attribution to NGX/the company. Third-party journalism is **copyrighted**:

- **Do:** show **headline + outlet + timestamp + a link out** to the original (the Google-News / aggregator pattern), ideally via each outlet's **RSS feed** (published *for* syndication) or a licensed content API. A short RSS-provided snippet is the most we render.
- **Don't:** scrape and republish full article bodies, mirror paywalled content, or strip attribution. That's a copyright (and goodwill) problem.
- Confirm each outlet's RSS/reuse terms before including it (D-C); some forbid commercial aggregation.

So: **disclosures = first-class content; media = pointers, never reproductions.**

---

## 4. Architecture (reuse the ingestion pattern)

Mirrors the env-guarded `MarketDataSource` design already in `src/ingestion/sources/`.

```
NGX disclosure feed (licensed)     third-party RSS / licensed API
        │  env-guarded adapter             │  env-guarded adapter
        ▼                                   ▼
src/ingestion/sources/  DisclosureSource / NewsSource  (+ fixture source for dev)
        ▼
src/data/   stores disclosures + news items (source of truth)
        ▼
src/api/    getDisclosures(ticker) / getNews(ticker)  (gathers stored items; G1 — no figures derived)
        ▼
src/web/    <CompanyFilings> on the stock page (disclosures first, then tagged headlines)
```

- **Layering rule holds:** the UI reads stored, computed items from `src/data`/`src/api`; it never fetches a feed ad hoc.
- **Env-guarded + fixtures:** runs on placeholder fixtures until the real feeds are configured (same pattern as the NGX price adapter and the delayed quote).
- Mapping (feed → domain) isolated in a `*-mapping.ts` so the real endpoint shape is a small change once licensed.

New domain types (sketch):

```ts
interface Disclosure {
  ticker: string;
  title: string;
  type: 'results' | 'dividend' | 'board' | 'material-event' | 'corporate-action' | 'other';
  publishedAt: string;   // ISO
  sourceUrl: string;     // the NGX filing / PDF
}
interface NewsItem {
  title: string;
  outlet: string;
  url: string;           // link out — never our own copy
  publishedAt: string;
  tickers: string[];     // tagged NGX names, when known
  snippet?: string;      // short, from the RSS feed only
}
```

---

## 5. What it does NOT touch (explicit)

- **G1 — our numbers.** News/filings are **qualitative context, kept separate from the computed panels.** A figure in a headline or filing is never rendered as a NaijaXch-computed number. (A filing's *figures* only become "our" numbers once they pass through the rules engine as fundamentals — that's the existing pipeline, not this feature.)
- **AI — unchanged.** We do **not** feed news into the AI summary or have the model summarise filings here. That's a separate change behind **#4**.
- **Chart — unchanged.** No news overlays on the EOD chart in this slice.

---

## 6. Schema (new migration — #2, human-run)

| Table | Key columns | Notes |
|---|---|---|
| `disclosure` | `id`, `ticker` FK→company, `title`, `type`, `published_at`, `source_url`, `created_at` | Dedupe by (ticker, source_url). Index (ticker, published_at desc). |
| `news_item` | `id`, `outlet`, `title`, `url` (unique), `published_at`, `tickers` (text[]), `snippet?`, `created_at` | Link-out only; no article body column (copyright, §3). |

---

## 7. Guardrail impact

| Guardrail | Impact | Handling |
|---|---|---|
| G1 — numbers from data | Unchanged | news is qualitative, separated from computed panels |
| G2 — no advice | Low | factual headlines/filings; no "buy because…"; no editorialising |
| Copyright | **The media gate** | disclosures full; third-party = headline + attribution + link-out (§3) |
| #6 — third-party integration | At go-live | env-guarded; confirm NGX disclosure feed + media terms |
| #2 — schema | Two tables | human-run migration |
| #4 — AI grounding | Not crossed | news not fed to AI in this proposal |
| G4 — PII | None | public content |

---

## 8. Decisions I need

- **D-A — Scope:** NGX disclosures only for the first slice (recommended) vs include a third-party headline strip now.
- **D-B — Media model:** RSS headlines + link-out (recommended) vs pursue a licensed full-text deal.
- **D-C — Outlets:** if we include media, which sources, and confirm each one's RSS/reuse terms.
- **D-D — AI summaries of filings:** defer (recommended) vs scope now (separate #4).
- **D-E — Surface:** per-company section first (recommended) vs also a global news page.
- **D-F — Real source (blocking go-live):** confirm access to the NGX disclosure feed/product and any media licensing (#6) — commercial/legal step, like the price feed.

---

## 9. Build sequence (once approved)

1. Migration: `disclosure` (+ `news_item` if D-A includes media) — you review/run.
2. `src/data` store + `src/ingestion` `DisclosureSource` (env-guarded) + fixture source — pure mapping unit-tested.
3. `src/api` `getDisclosures(ticker)` (+ `getNews`) — gathers stored items.
4. `<CompanyFilings>` on the stock page (disclosures first; tagged headlines as link-outs with attribution).
5. (Later / separate) global news page, alerts, AI summaries (#4), macro.

Each step keeps mapping pure + tested; news/filings never enter the computed panels (G1) or the AI grounding (#4).

---

*Plan only — not legal advice. Displaying third-party journalism carries copyright obligations; confirm RSS/reuse terms and the NGX disclosure feed access (D-F) before go-live. Disclosures are shown in full as official regulatory filings, with attribution.*
