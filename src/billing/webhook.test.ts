import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { classifyPaystackEvent, verifyPaystackSignature } from './webhook';

const SECRET = 'sk_test_secret';

function sign(body: string): string {
  return crypto.createHmac('sha512', SECRET).update(body).digest('hex');
}

describe('verifyPaystackSignature', () => {
  const body = JSON.stringify({ event: 'charge.success', data: { id: 1 } });

  it('accepts a correct signature over the raw body', () => {
    expect(verifyPaystackSignature(body, sign(body), SECRET)).toBe(true);
  });

  it('rejects a wrong signature', () => {
    expect(verifyPaystackSignature(body, sign('tampered'), SECRET)).toBe(false);
  });

  it('rejects when the body differs by a byte (re-serialization)', () => {
    expect(verifyPaystackSignature(body + ' ', sign(body), SECRET)).toBe(false);
  });

  it('rejects missing signature or secret', () => {
    expect(verifyPaystackSignature(body, null, SECRET)).toBe(false);
    expect(verifyPaystackSignature(body, sign(body), '')).toBe(false);
  });

  it('rejects a different secret', () => {
    expect(verifyPaystackSignature(body, sign(body), 'other_secret')).toBe(false);
  });
});

describe('classifyPaystackEvent', () => {
  it('activates on payment/subscription create', () => {
    expect(classifyPaystackEvent('charge.success')).toBe('activate');
    expect(classifyPaystackEvent('subscription.create')).toBe('activate');
  });
  it('deactivates on subscription disable', () => {
    expect(classifyPaystackEvent('subscription.disable')).toBe('deactivate');
  });
  it('is a no-op for grace events and unknown events', () => {
    expect(classifyPaystackEvent('subscription.not_renew')).toBe('noop');
    expect(classifyPaystackEvent('invoice.payment_failed')).toBe('noop');
    expect(classifyPaystackEvent('something.else')).toBe('noop');
  });
});
