import { describe, expect, it } from 'vitest';
import type { CorporateAction } from '@/data/types';
import { actionTypeLabel, describeAction, sortActionsDesc } from './corporateActions';

describe('describeAction', () => {
  it('describes a bonus', () => {
    const a: CorporateAction = {
      ticker: 'X',
      exDate: '2024-06-01',
      type: 'bonus',
      terms: { newShares: 1, perHeld: 10 },
    };
    expect(describeAction(a)).toBe('Bonus issue — 1 new for every 10 held');
  });

  it('describes a split', () => {
    const a: CorporateAction = {
      ticker: 'X',
      exDate: '2024-06-01',
      type: 'split',
      terms: { newShares: 2, perHeld: 1 },
    };
    expect(describeAction(a)).toBe('Stock split — 2 new for every 1 held');
  });

  it('describes a rights issue with the subscription price', () => {
    const a: CorporateAction = {
      ticker: 'X',
      exDate: '2024-06-01',
      type: 'rights',
      terms: { newShares: 1, perHeld: 2, subscriptionPrice: 7, cumPrice: 10 },
    };
    expect(describeAction(a)).toBe('Rights issue — 1 new for every 2 held at ₦7.00');
  });
});

describe('actionTypeLabel', () => {
  it('maps types to short labels', () => {
    expect(actionTypeLabel('bonus')).toBe('Bonus');
    expect(actionTypeLabel('split')).toBe('Split');
    expect(actionTypeLabel('rights')).toBe('Rights');
  });
});

describe('sortActionsDesc', () => {
  it('orders most-recent ex-date first without mutating input', () => {
    const input: CorporateAction[] = [
      { ticker: 'X', exDate: '2022-01-01', type: 'bonus', terms: { newShares: 1, perHeld: 4 } },
      { ticker: 'X', exDate: '2024-01-01', type: 'bonus', terms: { newShares: 1, perHeld: 4 } },
    ];
    const before = input.map((a) => a.exDate);
    expect(sortActionsDesc(input).map((a) => a.exDate)).toEqual(['2024-01-01', '2022-01-01']);
    expect(input.map((a) => a.exDate)).toEqual(before);
  });
});
