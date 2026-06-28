/**
 * src/billing — freemium paywall + naira subscription via Paystack (Step 5).
 *
 * GUARDRAIL: billing handles money — changes require human approval (CLAUDE.md
 * #3). NaijaXch never holds or moves customer funds (scope lock): Paystack holds
 * the money; we mirror subscription status and flip `users.tier`. Secrets in
 * env only (G5); never log full payloads or codes (G4).
 */

export { getTier, isPremium } from './access';
export {
  billingEnabled,
  disableSubscription,
  fetchSubscription,
  initSubscriptionCheckout,
  verifyTransaction,
  type CheckoutInit,
} from './paystack';
export {
  classifyPaystackEvent,
  verifyPaystackSignature,
  type TierAction,
} from './webhook';
