import { dataStore } from '@/data';

export default async function HomePage() {
  const companies = await dataStore.listCompanies();

  return (
    <div className="home">
      <h1 className="home__title">Make NGX trend analysis fluid.</h1>
      <p className="home__lede">
        Robinhood-grade interactive charts for Nigerian stocks — built on a clean,
        corporate-action-adjusted, end-of-day price series. Tap a timeframe, drag to read any point.
      </p>

      <h2 className="home__subtitle">Sample companies</h2>
      <ul className="home__companies">
        {companies.map((c) => (
          <li key={c.ticker}>
            <a href={`/stocks/${c.ticker}`}>
              <strong>{c.ticker}</strong> — {c.name}
              <span className="home__sector">{c.sector}</span>
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
