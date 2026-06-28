/**
 * Pure formatting for the corporate-actions list on company pages. These are
 * the actions the trend engine adjusts for (G6) — showing them explains why the
 * chart stays continuous across each ex-date.
 */

import type { BonusOrSplitTerms, CorporateAction, RightsTerms } from '@/data/types';
import { formatNaira } from '@/series';

export function describeAction(action: CorporateAction): string {
  switch (action.type) {
    case 'rights': {
      const t = action.terms as RightsTerms;
      return `Rights issue — ${t.newShares} new for every ${t.perHeld} held at ${formatNaira(
        t.subscriptionPrice,
      )}`;
    }
    case 'split': {
      const t = action.terms as BonusOrSplitTerms;
      return `Stock split — ${t.newShares} new for every ${t.perHeld} held`;
    }
    case 'bonus':
    default: {
      const t = action.terms as BonusOrSplitTerms;
      return `Bonus issue — ${t.newShares} new for every ${t.perHeld} held`;
    }
  }
}

export function actionTypeLabel(type: CorporateAction['type']): string {
  return type === 'rights' ? 'Rights' : type === 'split' ? 'Split' : 'Bonus';
}

/** Most recent ex-date first. */
export function sortActionsDesc(actions: CorporateAction[]): CorporateAction[] {
  return [...actions].sort((a, b) => b.exDate.localeCompare(a.exDate));
}
