/**
 * CompanyFilings (proposal 0009) — official NGX disclosures for a company.
 *
 * Server component: renders stored filings (computed/gathered in src/api). These
 * are qualitative context shown ALONGSIDE — never inside — the computed panels
 * (G1), and they don't feed the AI (#4). Each links out to the official NGX
 * filing with attribution; we never re-host third-party content.
 */

import type { Disclosure, DisclosureType } from '@/data';
import { formatDate } from '@/series';

const TYPE_LABEL: Record<DisclosureType, string> = {
  results: 'Results',
  dividend: 'Dividend',
  board: 'Board',
  'material-event': 'Material event',
  'corporate-action': 'Corporate action',
  other: 'Filing',
};

export function CompanyFilings({ disclosures }: { disclosures: Disclosure[] }) {
  if (disclosures.length === 0) return null;

  return (
    <section className="filings" aria-label="Company filings and disclosures">
      <header className="filings__head">
        <h2 className="filings__title">Filings &amp; news</h2>
        <span className="filings__source">Official NGX disclosures</span>
      </header>

      <ul className="filings__list">
        {disclosures.map((d) => (
          <li key={d.sourceUrl} className="filings__item">
            <span className={`filings__tag filings__tag--${d.type}`}>{TYPE_LABEL[d.type]}</span>
            <a className="filings__link" href={d.sourceUrl} target="_blank" rel="noopener noreferrer">
              {d.title}
            </a>
            <time className="filings__date" dateTime={d.publishedAt}>
              {formatDate(d.publishedAt.slice(0, 10))}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
