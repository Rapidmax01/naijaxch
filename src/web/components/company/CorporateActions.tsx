/**
 * Corporate-actions list for a company page (spec §7). Server component — it
 * only displays source-of-truth data. These are the actions the trend engine
 * back-adjusts for (G6), so the chart stays continuous across each ex-date.
 */

import type { CorporateAction } from '@/data/types';
import { formatDate } from '@/series';
import { actionTypeLabel, describeAction, sortActionsDesc } from './corporateActions';

export function CorporateActions({ actions }: { actions: CorporateAction[] }) {
  if (actions.length === 0) {
    return (
      <section className="corp-actions">
        <h2 className="corp-actions__title">Corporate actions</h2>
        <p className="corp-actions__empty">No bonus, split, or rights issues on record.</p>
      </section>
    );
  }

  const sorted = sortActionsDesc(actions);

  return (
    <section className="corp-actions" aria-label="Corporate actions">
      <h2 className="corp-actions__title">Corporate actions</h2>
      <table className="corp-actions__table">
        <thead>
          <tr>
            <th>Ex-date</th>
            <th>Type</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={`${a.exDate}-${a.type}`}>
              <td>{formatDate(a.exDate)}</td>
              <td>
                <span className={`corp-actions__tag corp-actions__tag--${a.type}`}>
                  {actionTypeLabel(a.type)}
                </span>
              </td>
              <td>{describeAction(a)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="corp-actions__note">
        The trend chart is back-adjusted for these — the line stays continuous across each ex-date
        rather than showing a false cliff.
      </p>
    </section>
  );
}
