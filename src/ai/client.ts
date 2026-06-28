/**
 * Anthropic client wrapper for the AI summary service. Env-guarded: callers
 * check aiEnabled() first. Default model claude-opus-4-8 (AI_MODEL to override).
 *
 * Only imported by the generation path (summary.ts / generate.ts), never by the
 * page render path — so the SDK stays out of the web bundle. Keys live in env
 * only (G5); we never log prompts or keys.
 */

import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.AI_MODEL ?? 'claude-opus-4-8';

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Single-shot generation. Returns the model's concatenated text output. */
export async function generateNarration(system: string, user: string): Promise<string> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system,
    messages: [{ role: 'user', content: user }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}
