import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildDelayedQuote, configuredDelayMinutes } from '../quote';

describe('buildDelayedQuote', () => {
  it('computes the change and percent vs the previous close', () => {
    const q = buildDelayedQuote({
      ticker: 'GTCO',
      price: 42.85,
      previousClose: 41.9,
      asOf: '2024-06-27',
      delayMinutes: 15,
    });
    expect(q.price).toBe(42.85);
    expect(q.change).toBe(0.95);
    expect(q.changePct).toBe(2.27); // 0.95 / 41.9 * 100, rounded 2dp
    expect(q.delayMinutes).toBe(15);
    expect(q.asOf).toBe('2024-06-27');
  });

  it('is negative when the price falls', () => {
    const q = buildDelayedQuote({
      ticker: 'X',
      price: 9,
      previousClose: 10,
      asOf: '2024-01-02',
      delayMinutes: null,
    });
    expect(q.change).toBe(-1);
    expect(q.changePct).toBe(-10);
  });

  it('rounds ₦ and % to 2dp (no float drift, TS3)', () => {
    const q = buildDelayedQuote({
      ticker: 'X',
      price: 10.123,
      previousClose: 9.987,
      asOf: '2024-01-02',
      delayMinutes: null,
    });
    expect(q.price).toBe(10.12);
    expect(q.change).toBe(0.14); // 10.123 - 9.987 = 0.136 → 0.14
  });

  it('yields 0% rather than dividing by a zero previous close', () => {
    const q = buildDelayedQuote({
      ticker: 'X',
      price: 5,
      previousClose: 0,
      asOf: '2024-01-02',
      delayMinutes: null,
    });
    expect(q.changePct).toBe(0);
    expect(q.change).toBe(5);
  });
});

describe('configuredDelayMinutes', () => {
  const env = process.env;
  afterEach(() => {
    process.env = env;
    vi.unstubAllEnvs();
  });

  it('is null (end-of-day) when no delayed tier is configured', () => {
    vi.stubEnv('NGX_DATA_TIER', '');
    expect(configuredDelayMinutes()).toBeNull();
  });

  it('is null for the eod tier', () => {
    vi.stubEnv('NGX_DATA_TIER', 'eod');
    expect(configuredDelayMinutes()).toBeNull();
  });

  it('defaults to 15 minutes when the delayed tier omits a minute count', () => {
    vi.stubEnv('NGX_DATA_TIER', 'delayed');
    vi.stubEnv('NGX_DATA_DELAY_MINUTES', '');
    expect(configuredDelayMinutes()).toBe(15);
  });

  it('reads the configured delayed minute count', () => {
    vi.stubEnv('NGX_DATA_TIER', 'delayed');
    vi.stubEnv('NGX_DATA_DELAY_MINUTES', '30');
    expect(configuredDelayMinutes()).toBe(30);
  });
});
