/**
 * Paystack webhook helpers — pure, unit-tested (the security-critical part).
 *
 * Paystack signs each webhook with HMAC-SHA512 of the RAW request body using
 * the secret key, in the `x-paystack-signature` header. We verify against the
 * raw body (a re-serialized body would change the bytes and fail). Events map
 * to a tier action; the route applies it idempotently.
 *
 * GUARDRAIL: billing handles money (CLAUDE.md #3). Provider is the source of
 * truth; we only mirror status. Never log secrets or full payloads (G4/G5).
 */

import crypto from 'node:crypto';

/** Constant-time verify of the Paystack signature against the raw body. */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type TierAction = 'activate' | 'deactivate' | 'noop';

/** Map a Paystack event name to whether it grants or revokes premium. */
export function classifyPaystackEvent(event: string): TierAction {
  switch (event) {
    case 'charge.success':
    case 'subscription.create':
      return 'activate';
    case 'subscription.disable':
      return 'deactivate';
    // not_renew / payment_failed keep premium until the subscription actually
    // ends (Paystack then fires subscription.disable).
    default:
      return 'noop';
  }
}
