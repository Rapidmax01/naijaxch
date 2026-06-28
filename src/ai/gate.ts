/**
 * The validation gate — the safety core of the AI pipeline (G1/G2).
 * Pure, no I/O, exhaustively unit-tested. If any check fails the summary is
 * REJECTED (never published) rather than risk showing a model-authored number.
 */

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

/** Advice phrases that must never appear (G2 — general information only). */
const ADVICE_PATTERNS: RegExp[] = [
  /\byou should\b/i,
  /\bwe recommend\b/i,
  /\b(buy|sell|hold)\b/i,
  /\bbest (stock|buy|pick)\b/i,
  /\b(strong|good|great) (buy|sell)\b/i,
  /\binvest in\b/i,
  /\bright for (you|your)\b/i,
  /\bshould (buy|sell|invest|consider)\b/i,
];

/** Unique placeholder keys used in the text. */
export function usedPlaceholders(text: string): string[] {
  const keys = new Set<string>();
  for (const m of text.matchAll(PLACEHOLDER_RE)) keys.add(m[1]!);
  return [...keys];
}

/** Text with all `{{...}}` tokens removed (what the model actually authored). */
export function stripPlaceholders(text: string): string {
  return text.replace(PLACEHOLDER_RE, '');
}

/** True if the model authored any digit outside a placeholder. */
export function hasRawDigits(text: string): boolean {
  return /\d/.test(stripPlaceholders(text));
}

export function hasAdviceLanguage(text: string): boolean {
  return ADVICE_PATTERNS.some((re) => re.test(text));
}

export interface GateResult {
  ok: boolean;
  reason?: string;
}

/**
 * Validate model output against the grounding rules. All must pass:
 *  1. only known placeholders, 2. no raw digits, 3. no advice language.
 */
export function validateNarration(text: string, allowedKeys: string[]): GateResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { ok: false, reason: 'empty output' };

  const unknown = usedPlaceholders(trimmed).filter((k) => !allowedKeys.includes(k));
  if (unknown.length > 0) {
    return { ok: false, reason: `unknown placeholder(s): ${unknown.join(', ')}` };
  }
  if (hasRawDigits(trimmed)) {
    return { ok: false, reason: 'model authored a raw number (G1 violation)' };
  }
  if (hasAdviceLanguage(trimmed)) {
    return { ok: false, reason: 'output contains advice language (G2 violation)' };
  }
  return { ok: true };
}

/** Substitute validated values for placeholders. Run ONLY after validateNarration passes. */
export function renderNarration(text: string, values: Record<string, string>): string {
  return text.replace(PLACEHOLDER_RE, (_, key: string) => values[key] ?? '—');
}
