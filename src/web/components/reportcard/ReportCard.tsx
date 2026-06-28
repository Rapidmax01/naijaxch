/**
 * ReportCard — renders the deterministic rules-engine output (spec §6.1).
 *
 * Server component: it only displays figures already computed by src/rules.
 * No number is produced here (G1). The mandatory disclaimer is rendered by the
 * page; flags use general-information phrasing only (G2).
 */

import type { ReportCard as ReportCardData } from '@/rules';

const STATUS_LABEL: Record<string, string> = {
  good: 'Healthy',
  neutral: 'Info',
  watch: 'Watch',
};

export function ReportCard({ card }: { card: ReportCardData }) {
  return (
    <section className="reportcard" aria-label="Automated report card">
      <header className="reportcard__head">
        <h2 className="reportcard__title">Report card</h2>
        <span className="reportcard__period">{card.period}</span>
      </header>

      {card.flags.length > 0 && (
        <ul className="reportcard__flags">
          {card.flags.map((flag, i) => (
            <li key={i} className="reportcard__flag">
              {flag}
            </li>
          ))}
        </ul>
      )}

      <dl className="reportcard__metrics">
        {card.metrics.map((m) => (
          <div key={m.key} className={`reportcard__metric reportcard__metric--${m.status}`}>
            <dt className="reportcard__label">{m.label}</dt>
            <dd className="reportcard__value">
              {m.display}
              <span className={`reportcard__status reportcard__status--${m.status}`}>
                {STATUS_LABEL[m.status]}
              </span>
            </dd>
            {m.note && <p className="reportcard__note">{m.note}</p>}
          </div>
        ))}
      </dl>
    </section>
  );
}
