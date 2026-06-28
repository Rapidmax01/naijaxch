---
description: Trend engine — adjusted EOD price series, corporate-action adjustment, and the fluid trend chart. Load when working on charts or price series.
paths:
  - "src/series/**"
  - "src/web/**/chart*"
  - "src/web/**/trend*"
  - "src/data/**/prices*"
---

<!-- Place at .claude/rules/trend-engine.md
     This is the centerpiece feature (the wedge). The chart is the reason users switch. -->

# Trend Engine — Guardrails & Spec

Fluid NGX trend analysis is NaijaXch's headline differentiator. Two halves: a clean **adjusted price series** and a **fluid chart front-end**. Build both to a high bar.

## Non-negotiables

- **TS1 — Charts plot `adjClose`, never `close`.** Raw historical prices on a multi-period chart show fake cliffs on every bonus/rights ex-date. Plotting raw is a correctness bug.
- **TS2 — Trend views are EOD daily.** Phase 1 uses end-of-day daily closes. Do NOT wire a real-time/intraday feed (separate paid licence — human approval required). Daily closes also keep thinly-traded names looking clean; do not switch to intraday to "fix" gaps.
- **TS3 — Round every displayed number.** ₦ to 2 dp, % to 2 dp. No float artifacts on screen.
- **TS4 — Display values are computed from the series, never from an LLM.** (Consistent with G1.)

## Data contract (the adjusted EOD series)

Per equity, daily rows: `ticker`, `date`, `close`, `adjClose`, `volume`, `adjFactor`.
- `adjClose` is what every chart consumes.
- `close` and `adjFactor` are kept for reference/audit.

## Corporate-action adjustment (back-adjustment)

1. Per ticker, hold a list of actions: `{ex_date, type, terms}` (bonus, split, rights) sourced from NGX corporate-actions data.
2. Per-action factor:
   - **Bonus / split**, N new per M held → `factor = M / (M + N)`.
   - **Rights issue** → `factor = TERP / cum_price` (TERP = theoretical ex-rights price from subscription price + ratio). **Rights is the error-prone case — implement explicitly and unit-test it.**
   - Cash dividends are NOT adjusted into the price-trend series (that is total-return; keep separate/optional later).
3. For each day, `adjFactor` = product of factors whose `ex_date` is strictly AFTER that day; `adjClose = close * adjFactor`.
4. Recompute on every new corporate action. Each adjustment has a unit test vs a known-good fixture before it powers a chart.

## Chart interaction states (match the approved prototype)

- **Timeframes:** 1M (~22 trading days), 3M (~66), 6M (~132), 1Y (~252), 5Y/Max. Active state highlighted; tap redraws the window.
- **Default:** 1Y. Headline = latest `adjClose`; change shown vs the window's first point, in ₦ and %.
- **Color by period:** line, area fill, and change text green if net window change ≥ 0, else red.
- **Reference line:** faint dashed horizontal at the window's start price.
- **Scrub (pointer + touch):** snaps to nearest trading day → crosshair + dot; headline price, date, and % update live (change vs window start). Release/leave → reset to latest.
- **States:** loading skeleton; empty/no-data; optional "thinly traded" hint on low window volume.
- **Accessibility:** screen-reader text summary; timeframe controls are real `<button>`s.

## Portfolio-level trend (same component)

Sum the user's tracked holdings × `adjClose` per day into a portfolio time-series; render with the same scrubbable component. Same EOD data, same front-end. This is a Phase-1 differentiator — broker apps don't offer it.

## Performance

- Precompute and cache windowed series; don't recompute adjustment on every request.
- The chart must feel instant on timeframe switch and scrub — this is the product. Treat jank as a bug, not a polish item.
