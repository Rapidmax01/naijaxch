import { dataStore } from '@/data';

export default async function HomePage() {
  const companies = await dataStore.listCompanies();

  return (
    <div className="home">
      <section className="home__hero">
        <span className="eyebrow">NGX · delayed / end-of-day</span>
        <h1 className="home__title">
          Make NGX trend analysis <em>fluid.</em>
        </h1>
        <p className="home__lede">
          Robinhood-grade interactive charts for Nigerian stocks — built on a clean,
          corporate-action-adjusted, end-of-day price series. Tap a timeframe, drag to read any
          point.
        </p>
        <div className="home__cta">
          <a className="btn btn--primary" href="/screener">
            Screen NGX stocks →
          </a>
          <a className="btn btn--ghost" href="/heatmap">
            Market heatmap
          </a>
          <a className="btn btn--ghost" href="/pricing">
            Pricing
          </a>
        </div>
      </section>

      <div className="home__section-head">
        <h2 className="home__subtitle">Markets</h2>
        <span className="pill">{companies.length} NGX names</span>
      </div>
      <ul className="home__companies">
        {companies.map((c) => (
          <li key={c.ticker}>
            <a href={`/stocks/${c.ticker}`} className="mkt">
              <span className="mkt__row">
                <strong className="mkt__ticker">{c.ticker}</strong>
                <span className="mkt__sector">{c.sector}</span>
              </span>
              <span className="mkt__name">{c.name}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="home__note">
        Sample data only — placeholder figures until the licensed NGX delayed/EOD feed is wired.
      </p>
    </div>
  );
}
