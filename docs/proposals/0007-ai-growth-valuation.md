# Proposal 0007 — Growth & Valuation in AI Summaries

**Status:** Draft for review (no code written)
**Author:** Claude + Obinna
**Date:** 2026-06-29
**Depends on:** Proposal 0006 (growth metrics + N-year P/E — now shipped); the AI pipeline (`src/ai`).
**Approval gate (the whole point of this doc):**
- **#4 — changes to the AI grounding or validation-gate logic** (CLAUDE.md / `.claude/rules/ai-pipeline.md`). Nothing here is built without your sign-off.

> Plan and checklist only. The safety invariant does not change — see §2.

---

## 1. Goal

Let the AI summary narrate a company's **growth** (revenue YoY, ROE) and **valuation-vs-history** (current P/E vs its multi-year average), in addition to the single-period report-card metrics it already covers. Two or three neutral sentences, e.g.:

> "The data shows revenue grew {{revenueGrowth}} year-on-year, with a return on equity of {{roe}}. {{peContext}}."

→ renders as → "…revenue grew +12.50% year-on-year, with a return on equity of 18.00%. It trades about 35% below its 5-year average P/E."

---

## 2. The safety invariant is UNCHANGED (why this is low-risk)

The pipeline's safety doesn't come from the prompt — it comes from the **placeholder + post-gate substitution** design (`.claude/rules/ai-pipeline.md`):

1. The model is shown placeholders + qualitative status, **never numbers**.
2. The model writes prose referencing figures only as `{{tokens}}`, with **no digits**.
3. The **gate** rejects any output with an unknown placeholder, a raw digit, or advice language.
4. Numbers are substituted **after** the gate passes.

This proposal **keeps all four steps exactly as they are.** It only:
- **adds more placeholders** to the facts map (growth/valuation) — the gate is already data-driven on `allowedKeys`, so more keys need no gate-logic change; and
- **tightens** the advice gate with valuation-judgment terms (§4) — a strictly safe direction.

The model still never authors a number; the gate still drops a bad summary rather than publish it. We are widening *what can be narrated*, not weakening *how it's checked*.

---

## 3. Changes (all in `src/ai`, all #4-gated)

| File | Change | Risk |
|---|---|---|
| `facts.ts` (`buildFacts`) | Accept optional `growth` + `valuation`; add placeholders (§5). Status words for growth (e.g. `up`/`down`) shown to the model; values (digit-laden) go only in the post-gate map. | Low — additive |
| `summary.ts` (`SYSTEM_PROMPT`, `generateSummary`) | Pass growth/valuation through; extend the prompt to list the new placeholders and **reinforce neutral framing** (describe, don't judge). | Low |
| `gate.ts` (`ADVICE_PATTERNS`) | **Add** valuation/advice terms — `undervalued`, `overvalued`, `cheap`, `expensive`, `bargain`, `attractive`, `opportunity`, `mispriced`. | Tightening (safe) |
| `generate.ts` | Load `getGrowthReport` + `getPeHistory` alongside the card; pass to `generateSummary`. | Low |
| `facts.test.ts`, `gate.test.ts` | New cases: growth/valuation placeholders allowed; new advice terms rejected; a digit in a growth value still substituted post-gate. | — |

No change to the four gate *steps* or the substitution mechanic.

---

## 4. The real risk: valuation tempts advice (G2)

Growth + "below its average P/E" is exactly the kind of context that nudges a model toward **"undervalued / cheap / attractive / a bargain / an opportunity"** — which is advice-adjacent and currently **not** in `ADVICE_PATTERNS`. So the integration's core safety work is:

1. **Tighten the gate** (§3) so those words are auto-rejected. Adding patterns is the safe direction and is unit-tested before merge.
2. **Constrain the framing in code, not the model.** Expose the P/E comparison as a single, pre-written `{{peContext}}` sentence built by our `peHistory().note` (e.g. "It trades about 35% below its 5-year average P/E.") rather than letting the model phrase the comparison. The model places the token; it doesn't author the judgment. (Decision D-A.)
3. **Prompt reinforcement:** "Describe figures neutrally. Never characterise a valuation as cheap, expensive, undervalued, or attractive."

---

## 5. Placeholders to add (Decision D-B)

Recommended minimal set (keeps the summary to 2–3 sentences):

| Placeholder | Value (post-gate) | Model sees (status) |
|---|---|---|
| `{{revenueGrowth}}` | `+12.50%` | "revenue growth: up" |
| `{{roe}}` | `18.00%` | "return on equity: neutral" |
| `{{peContext}}` | "It trades about 35% below its 5-year average P/E." | "valuation vs history: below average" |

- Growth/valuation are **omitted** (no placeholder offered, not shown to the model) when not computable — loss-makers, <2 periods, no price overlap — so the model can't reference a figure that doesn't exist. (Same fail-safe as today's null metrics.)
- EPS growth / dividend growth / CAGR can be added later; start tight.

---

## 6. Guardrail impact

| Guardrail | Impact | Handling |
|---|---|---|
| G1 — numbers never from the LLM | Unchanged | placeholders + post-gate substitution kept exactly |
| G2 — no advice | **Heightened** | gate tightened with valuation terms (§4); prompt reinforced; comparison phrased in our code |
| #4 — grounding/gate approval | This is the sign-off | gate stays pure + unit-tested; tests added before any loosening |
| Disclaimer (G2) | Unchanged | every summary still renders the standing disclaimer (no #7) |
| Caching | Summaries must be **regenerated** | `npm run ai:generate` after merge (D-D) |
| Env-guard | Unchanged | no `ANTHROPIC_API_KEY` → section simply doesn't render |

---

## 7. Decisions I need

- **D-A — Valuation phrasing:** single pre-written `{{peContext}}` sentence (recommended — keeps the judgment in our code) vs granular `{{peVsAvg}}` + `{{peAverage}}` tokens the model frames itself.
- **D-B — Metric set:** start with revenue growth + ROE + P/E-context (recommended) vs include EPS/dividend growth + CAGR now.
- **D-C — Gate terms:** confirm the valuation-advice word list (§4) to add. Want any others (e.g. "discount", "premium")?
- **D-D — Regeneration:** confirm we regenerate all summaries post-merge (needs `DATABASE_URL` + `ANTHROPIC_API_KEY`); rejected ones stay unpublished, as today.
- **D-E — Scope of prose:** keep to 2–3 sentences (recommended) or allow a 4th when growth + valuation are both present.

---

## 8. Build sequence (once approved)

1. `gate.ts`: add valuation-advice patterns + tests (tighten first, before anything can use the new context).
2. `facts.ts`: add growth/valuation placeholders (status to model, values to the post-gate map) + tests.
3. `summary.ts`: thread growth/valuation through; extend the system prompt with the new tokens + neutral-framing rules.
4. `generate.ts`: load growth + P/E context per company; pass through.
5. Regenerate + spot-check a sample (incl. a loss-maker → no growth/valuation; a below-average-P/E name → neutral phrasing). Confirm the gate rejects a planted "undervalued" output.

Each step keeps the gate pure and unit-tested; a test is added before any rule is touched.

---

*Plan only — not financial advice. The AI never produces a figure; the gate fails safe. Confirm the grounding/gate changes (this is a §4 sign-off) before any code.*
