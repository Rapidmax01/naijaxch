import { describe, expect, it } from 'vitest';
import {
  hasAdviceLanguage,
  hasRawDigits,
  renderNarration,
  usedPlaceholders,
  validateNarration,
} from './gate';

const KEYS = ['company', 'period', 'eps', 'pe', 'dividendCover'];

describe('usedPlaceholders / stripPlaceholders', () => {
  it('extracts unique placeholder keys', () => {
    expect(usedPlaceholders('{{company}} had {{eps}} and {{eps}} again')).toEqual([
      'company',
      'eps',
    ]);
  });
});

describe('hasRawDigits', () => {
  it('ignores digits inside placeholders', () => {
    expect(hasRawDigits('{{company}} reported {{eps}}')).toBe(false);
  });
  it('flags a digit the model authored', () => {
    expect(hasRawDigits('Dividend cover is below 1')).toBe(true);
    expect(hasRawDigits('{{company}} grew 20% this year')).toBe(true);
  });
});

describe('hasAdviceLanguage', () => {
  it('flags advice phrasing (G2)', () => {
    expect(hasAdviceLanguage('You should buy {{company}}')).toBe(true);
    expect(hasAdviceLanguage('We recommend this stock')).toBe(true);
    expect(hasAdviceLanguage('a strong buy')).toBe(true);
  });
  it('allows neutral information phrasing', () => {
    expect(hasAdviceLanguage('The data shows dividend cover at {{dividendCover}}.')).toBe(false);
  });
});

describe('validateNarration', () => {
  it('passes clean, placeholder-only narration', () => {
    const text = '{{company}} reported earnings per share of {{eps}} for {{period}}.';
    expect(validateNarration(text, KEYS)).toEqual({ ok: true });
  });

  it('rejects unknown placeholders', () => {
    const r = validateNarration('{{company}} had {{revenue}}', KEYS);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('revenue');
  });

  it('rejects model-authored numbers (G1)', () => {
    const r = validateNarration('{{company}} trades at a P/E of 10', KEYS);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('G1');
  });

  it('rejects advice language (G2)', () => {
    const r = validateNarration('Investors should buy {{company}}', KEYS);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('G2');
  });

  it('rejects empty output', () => {
    expect(validateNarration('   ', KEYS).ok).toBe(false);
  });
});

describe('renderNarration', () => {
  it('substitutes validated values; unknown keys fall back to dash', () => {
    const out = renderNarration('{{company}}: EPS {{eps}}, P/E {{pe}}', {
      company: 'Dangote Cement Plc',
      eps: '₦2.00',
      pe: '10x',
    });
    expect(out).toBe('Dangote Cement Plc: EPS ₦2.00, P/E 10x');
  });

  it('the rendered numbers come only from the values map (not the model)', () => {
    // The model text has no digits; every figure appears via substitution.
    const modelText = 'Dividend cover is {{dividendCover}}.';
    expect(hasRawDigits(modelText)).toBe(false);
    expect(renderNarration(modelText, { dividendCover: '0.67x' })).toBe(
      'Dividend cover is 0.67x.',
    );
  });
});
