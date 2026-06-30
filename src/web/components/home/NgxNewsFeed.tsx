/**
 * NgxNewsFeed (proposal 0009) — latest official NGX disclosures across all
 * companies, for the homepage. Qualitative context: never mixed with computed
 * panels (G1), not fed to the AI (#4). Each item links out to the filing and
 * through to the company page. Third-party media is deferred (copyright; D-B).
 */

import type { NewsFeedItem } from '@/api';
import type { DisclosureType } from '@/data';
import { formatDate } from '@/series';

const TYPE_LABEL: Record<DisclosureType, string> = {
  results: 'Results',
  dividend: 'Dividend',
  board: 'Board',
  'material-event': 'Material event',
  'corporate-action': 'Corporate action',
  other: 'Filing',
};

export function NgxNewsFeed({ items }: { items: NewsFeedItem[] }) {
  if (items.length === 0) return null;

  return (
    <>
      <div className="home__section-head">
        <h2 className="home__subtitle">Latest from the NGX</h2>
        <span className="pill">Official disclosures</span>
      </div>
      <ul className="newsfeed">
        {items.map((d) => (
          <li key={`${d.ticker}-${d.sourceUrl}`} className="newsfeed__item">
            <span className={`filings__tag filings__tag--${d.type}`}>{TYPE_LABEL[d.type]}</span>
            <span className="newsfeed__body">
              <a className="newsfeed__link" href={d.sourceUrl} target="_blank" rel="noopener noreferrer">
                {d.title}
              </a>
              <span className="newsfeed__meta">
                <a className="newsfeed__co" href={`/stocks/${d.ticker}`}>
                  {d.companyName} <span className="newsfeed__ticker">{d.ticker}</span>
                </a>
                <time className="newsfeed__date" dateTime={d.publishedAt}>
                  {formatDate(d.publishedAt.slice(0, 10))}
                </time>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
