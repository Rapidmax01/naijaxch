# NaijaXch — Phase 1 Build Specification (v2)

**Fluid trend analysis for the NGX. Research, tools, and community behind it. No execution. No analyst required.**

Prepared for: Obinna Uzoechi / Xdosdev Digital LTD
Status: Phase-1 PRD (build-ready)
Change in v2: trend analysis is now the centerpiece wedge, with a dedicated Trend Engine spec (§5). Domain note: naijaxch.com is being repurposed from the legacy crypto-arbitrage tool to this NGX research product.

---

## 1. The wedge (read this first)

Every existing NGX platform is built for **execution and settlement**, not analysis. Charting is an afterthought — static images, two timeframes, page reloads. Pulling a clean multi-year price series for an NGX name is genuinely hard, so even the apps that try cannot offer smooth historical exploration. Meanwhile anyone who has used Robinhood expects to tap a timeframe and drag across a line to read any point instantly.

**NaijaXch's headline identity is: the first platform that makes NGX trend analysis fluid.** Research, screeners, automated report cards, AI summaries, and community are the depth behind that hook — but the thing that makes someone switch is the chart experience nobody else offers.

The key enabler: **fluid trend analysis runs on end-of-day daily data, not real-time.** Robinhood's *feel* comes from a great front-end plus a clean historical series — not tick data. So the most compelling differentiator runs on the cheapest NGX data tier (delayed/EOD), the one we launch on anyway. You do not need the expensive real-time licence to deliver a Robinhood-grade NGX trend experience.

---

## 2. What this is / is NOT

**Is:** an NGX research, data, tools, and community web app whose centerpiece is fluid trend analysis (per-stock and portfolio-level), supported by fundamentals, screeners, watchlists, portfolio tracking, automated report cards, AI plain-English summaries, and community.

**Is NOT (scope lock — not in Phase 1):**

- NO trade execution / order routing. We are not a broker.
- NO holding or moving customer funds.
- NO personalised investment advice — general information only.
- NO US / foreign securities — NGX only.
- NO real-time tick data at launch — delayed / EOD only.
- NO native mobile apps yet — responsive web first.

---

## 3. The four pillars (none require founder stock-picking)

1. **Trend analysis (the wedge).** Fluid, interactive, corporate-action-adjusted EOD charts — per stock and per portfolio. This is the headline. See §5.
2. **Tools & data utility.** Screener, watchlists, portfolio tracker, dividend calendar, alerts, capital-gains helper. No opinion required.
3. **Automated + AI analysis.** A rules engine (analytical logic written once, run on every stock) and an AI summary engine (grounded plain-English explanations). See §6.
4. **Community + diaspora.** User/contributor opinions and a diaspora ("own Nigeria from abroad") hook. The founder hosts; the crowd supplies takes.

The moat is "the only genuinely fluid NGX trend tool, with automated analysis, community, and a diaspora edge" — an engineering and product advantage, not a research one.

---

## 4. Target users

- Nigerian retail investors, especially newcomers (under ~3% participation — the gap is tooling, not appetite).
- Diaspora investors (the founder's own segment).
- Active NGX retail traders underserved by clunky broker apps and desperate for real charting.

---

## 5. THE TREND ENGINE (centerpiece spec)

This is the differentiator. It has two halves: a **clean adjusted price series** (the moat — hard to assemble) and a **fluid charting front-end** (good engineering — the founder's lane).

### 5.1 Runs on EOD daily data

- All trend views (1M / 3M / 6M / 1Y / 5Y / Max) are daily-close charts. No real-time feed required for Phase 1.
- Daily closes also handle NGX's thin liquidity gracefully: every trading day has a close even on low volume, so charts look clean even for illiquid names. (Intraday would look sparse and gappy — another reason EOD-first is correct, not a compromise.)

### 5.2 Data contract — the adjusted EOD series

Per equity, the trend engine consumes and stores a daily series:

| Field | Meaning |
|---|---|
| `ticker` | NGX symbol |
| `date` | trading day (ISO) |
| `close` | unadjusted closing price (kept for reference/audit) |
| `adjClose` | **corporate-action-adjusted** close — what charts plot |
| `volume` | day volume (for liquidity hints) |
| `adjFactor` | cumulative adjustment factor applied to this day |

Rule: **charts always plot `adjClose`. `close` is never plotted on a multi-period chart.** (See §5.4 — raw series make ex-dates look like fake crashes.)

### 5.3 Corporate-action adjustment (the hidden quality bar)

NGX companies do bonus and rights issues constantly. Plotting raw prices makes every ex-date a false cliff — the 5Y chart lies. Most NGX apps get this wrong. Doing it right is a visible, ownable quality gap.

Algorithm (back-adjustment):

1. Maintain, per ticker, a list of corporate actions: `{ex_date, type, ratio/terms}` (bonus, split, rights). Source from NGX corporate-actions/X-Compliance data.
2. Compute a per-action **adjustment factor**:
   - **Bonus / split** of N new per M held → factor `= M / (M + N)`.
   - **Rights issue** → factor based on the theoretical ex-rights price (TERP): `factor = TERP / cum_price`, where TERP accounts for the subscription price and ratio. *(Rights is the careful case — implement and unit-test it explicitly; it is the most error-prone.)*
   - Cash dividends are NOT adjusted for in the price-trend series (that would be total-return; keep it separate/optional later).
3. For each trading day, `adjFactor` = product of all action factors with `ex_date` strictly **after** that day. `adjClose = close * adjFactor`.
4. Recompute the series whenever a new corporate action lands. Every adjustment has a unit test against a known-good fixture before it powers a chart.

### 5.4 Interaction states (the front-end, from the prototype)

The component must reproduce the prototype feel:

- **Timeframe selector:** 1M (~22 trading days), 3M (~66), 6M (~132), 1Y (~252), 5Y/Max. Active state highlighted. Tapping redraws the window.
- **Default:** 1Y. Headline shows latest `adjClose`; change shown vs the window's first point, as ₦ and %.
- **Color by period performance:** line, area fill, and change text are green if net change over the window ≥ 0, else red.
- **Reference line:** faint dashed horizontal line at the window's starting price.
- **Scrub (pointer + touch):** moving/dragging over the chart snaps to the nearest trading day → crosshair + dot; the headline price, date, and % change update live to that point (change recomputed vs window start).
- **Release / leave:** headline resets to the latest point.
- **Number hygiene:** every displayed price/percent is rounded (₦ to 2 dp, % to 2 dp) — no float artifacts.
- **States:** loading skeleton; empty/no-data; optional "thinly traded" hint when window volume is low.
- **Accessibility:** chart has a text summary for screen readers; timeframe controls are real buttons.

### 5.5 Portfolio-level trend (same engine, second surface)

Robinhood's other win is the **portfolio value over time** chart. Reuse the engine: sum the user's tracked holdings × `adjClose` per day into a portfolio time-series, render with the same scrubbable component. Same EOD data, same front-end, applied to the user's portfolio instead of one stock. This is a Phase-1 differentiator the broker apps don't offer.

---

## 6. The supporting analysis engines

### 6.1 Rules engine (deterministic)

Analytical logic written once, run on every stock: valuation vs. history, dividend cover, debt/margin trend, growth → scores and flags → a visual report card. Pure, unit-tested functions. No human research per stock.

### 6.2 AI summary engine (narration only)

**The one rule that makes it safe: numbers are NEVER produced by the language model.** The system computes every figure deterministically; the LLM only writes plain-English prose around already-computed, already-validated figures. A validation gate blocks publishing if any number in the AI output doesn't trace to source data. Generate once per filing, cache, never on page load. Full mechanics live in `.claude/rules/ai-pipeline.md`.

---

## 7. Full feature set — MVP / Fast-follow / Later

| Feature | Scope |
|---|---|
| **Trend charts (adjusted EOD), per stock — 1M–5Y, scrub** | **MVP (top ~50–60 names)** |
| **Corporate-action-adjusted price series** | **MVP — required for charts to be correct** |
| **Portfolio-level trend chart** | **MVP / early fast-follow** |
| Company pages: price, fundamentals, corporate actions | MVP |
| Watchlists | MVP |
| Portfolio tracker (manual entry) | MVP |
| Stock screener | MVP |
| Market heatmap / pulse | MVP |
| Rules-engine report cards | MVP (top names) |
| AI summaries | MVP (top names) |
| Auth + freemium paywall + naira subscription billing | MVP |
| Full ~150-name coverage + full financial statements | Fast-follow |
| Alerts, dividend calendar, capital-gains helper | Fast-follow |
| Community feeds + user narratives + contributors | Fast-follow |
| CSCS portfolio import | Later |
| Real-time data upgrade (intraday charts) | Later / Phase 2 |
| Native mobile apps | Later |
| Broker execution handoff | Phase 2 |

**Freemium split:** Free = delayed/EOD data, limited reports, read-only community, basic trend timeframes. Premium (naira monthly) = full data, full trend history + portfolio trend, screeners, advanced portfolio tools, full report cards + AI summaries, full community.

---

## 8. Data sourcing plan

| Data element | Source | Method | Notes |
|---|---|---|---|
| Daily closes / volumes / indices | NGX market-data feed/API | Licensed **delayed or EOD** | Main recurring cost. Distribution licence required to show NGX data. |
| Corporate actions (bonus/rights/splits) | NGX X-Compliance / disclosures | Feed / parse | **Feeds the adjustment engine — first-class, not optional.** |
| Financial statements | Company quarterly/annual reports | PDF parse → structured | Labour, not licence fees |
| Reference data (sector, shares out) | NGX + filings | Feed + parse | — |
| `adjClose`, ratios, scores | Derived — rules/trend engines | Deterministic code | No external cost |
| Narratives | Derived — AI engine | Grounded LLM | Minor inference cost |

NGX licences data in tiers — real-time (priciest), 30-min delayed, end-of-day (cheapest). Pricing is quote-based via NGX's Market Data usage form (`ddinnovation@ngxgroup.com`, `marketdata@ngxgroup.com`); NGX also offers reference and historical products needed to backfill the trend series. **Launch on delayed/EOD.**

---

## 9. Technical architecture

- `src/web/` — responsive frontend; the trend chart is a first-class, reusable component.
- `src/series/` — **trend engine:** adjusted-series builder, corporate-action adjustment, windowing, portfolio aggregation.
- `src/data/` — single source of truth: prices (raw + adjusted), fundamentals, corporate actions, reference.
- `src/rules/` — deterministic rules engine.
- `src/ai/` — grounded AI summary service + validation gate.
- `src/ingestion/` — price poller (delayed/EOD), filings poller + parser, corporate-actions sync.
- `src/api/` — backend API.
- `src/auth/`, `src/billing/` — accounts, freemium paywall, naira subscription collection (via a payments provider).
- Layering rule: UI and AI read computed values from `src/data/`, `src/rules/`, `src/series/`. No data/business logic in API handlers or components.

---

## 10. Regulatory & compliance guardrails

- No execution + no customer funds → no SEC CMO licence.
- General information only → no Investment Adviser registration. ("The data shows…", never "you should buy…").
- NGX market-data distribution licence required to display data; start delayed/EOD.
- NDPA/NDPC: user data (accounts, portfolios, later CSCS) is regulated PII — lawful basis, security, no PII in logs.
- Disclaimers on every report/summary/chart: automated/general information, data delayed, standard risk warning.

> Confirm the data-licence terms with NGX and the "general information vs advice" boundary with a Nigerian capital-markets lawyer before launch.

---

## 11. MVP cut

Auth + freemium billing · NGX delayed/EOD data + corporate-action-adjusted series for top ~50–60 names · **fluid per-stock trend charts (1M–5Y, scrub)** · **portfolio-level trend** · company pages (price/fundamentals/corporate actions) · watchlists · manual portfolio tracker · screener · market heatmap · rules-engine report cards · AI summaries · light curated idea lists.

---

## 12. Rough cost & timeline

| Line | Phase-1 estimate |
|---|---|
| NGX delayed/EOD data licence | Quote-based — main recurring cost |
| Hosting / infra | Modest at launch |
| AI inference | Minor (generate-once-per-filing) |
| Filings parsing + adjustment engine | Mostly developer time |
| Build | Lean MVP ≈ 3–4 months (founder + Xdosdev or small team) |

No ₦100M anywhere. The binding costs are the data licence and build time.

---

## 13. Phase-2 bridge

Add execution only after you have engaged users with watchlists and tracked portfolios — the audience and buy-intent are the asset a broker pays for. A "Trade/Invest" button hands the order to a partner broker who is the licensed executor of record. NaijaXch stays the front-end and brand; the broker is the regulated pipe. No ₦100M, because you never become the dealing entity.

---

*Starting build spec, not legal advice. Confirm data-licence terms with NGX and the advice boundary with a Nigerian capital-markets lawyer before launch.*
