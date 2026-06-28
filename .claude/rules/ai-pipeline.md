---
description: AI summary pipeline — grounded generation + the validation gate that makes it safe. Load when working on src/ai.
paths:
  - "src/ai/**"
---

# AI Summary Pipeline — Guardrails & Mechanics

The AI summary engine writes plain-English narration around a company's report card. **Its one job is to be safe: numbers are NEVER produced by the language model** (G1). Hallucinated figures on a stock page are a trust-ending failure.

## The non-negotiable rule (G1)

Every numeric figure is computed deterministically by `src/rules` / `src/series` and validated *before* it reaches a user. The LLM only narrates — it does not produce, estimate, or "fill in" any number.

## How we enforce it: the placeholder + gate design

The model is structurally prevented from emitting numbers:

1. **Build facts** (`facts.ts`): from the computed report card, produce a map of `{{placeholder}} → formatted value` (e.g. `{{eps}} → ₦2.00`) and an allowed-key set. The model is shown the placeholders and each metric's qualitative status (`healthy`/`neutral`/`watch`) — **never the numeric values**.
2. **Generate** (`client.ts` → `summary.ts`): the model writes 2–3 sentences of prose, instructed to refer to every figure ONLY via the `{{placeholders}}` and to write **no digits at all**.
3. **Validate — the gate** (`gate.ts`), all must pass or the summary is REJECTED (never published):
   - **No raw numbers:** after stripping `{{...}}` tokens, the prose must contain no digit `0-9`. A digit means the model tried to author a number → reject.
   - **Known placeholders only:** every `{{key}}` must be in the allowed set → otherwise reject.
   - **No advice (G2):** no "buy"/"sell"/"you should"/"we recommend"/etc. → reject.
4. **Render:** substitute each `{{key}}` with its validated formatted value. The only numbers in the output are the computed, validated figures.

Because numbers are substituted *after* gating, the model never sees or writes them. If the model misbehaves, the gate drops the summary rather than publishing a wrong number — fail safe.

## Operational rules

- **Generate once per filing, cache, never on page load.** Summaries are precomputed (`src/ai/generate.ts`, `npm run ai:generate`) and stored; pages read the cached row.
- **Env-guarded.** No `ANTHROPIC_API_KEY` → generation is disabled and the summary section simply doesn't render.
- **Model:** default `claude-opus-4-8` (`AI_MODEL` env to override). Adaptive thinking, low effort.
- **Disclaimer (G2):** every rendered summary shows *"Automated, general information — not personalised advice."*
- **Changes to the grounding or gate logic require human approval** (CLAUDE.md #4). Keep the gate pure and unit-tested; add a test before loosening any rule.
