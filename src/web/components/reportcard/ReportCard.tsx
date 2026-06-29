/**
 * ReportCard — renders the deterministic rules-engine output (spec §6.1).
 *
 * Server component: it only displays figures already computed by src/rules.
 * No number is produced here (G1). The mandatory disclaimer is rendered by the
 * page; flags use general-information phrasing only (G2).
 */

import { formatNaira, type PriceContext } from '@/series';
import type { ReportCard as ReportCardData } from '@/rules';

const STATUS_LABEL: Record<string, string> = {
  good: 'Healthy',
  neutral: 'Info',
  watch: 'Watch',
};

/** Free users see a limited report card (spec §7). */
const FREE_METRIC_COUNT = 2;

/** General-information sentences about where the price sits (G2 — descriptive,
 * never advice). All figures are pre-computed in src/series (G1). */
function contextLines(ctx: PriceContext): string[] {
  const lines = [
    ctx.pctBelowHigh <= 0.5
      ? 'At its 1-year high.'
      : `${ctx.pctBelowHigh}% below its 1-year high.`,
    `${ctx.pctAboveLow}% above its 1-year low.`,
  ];
  if (ctx.vsAveragePct >= 0) {
    lines.push(`${ctx.vsAveragePct}% above its 1-year average (${formatNaira(ctx.average)}).`);
  } else {
    lines.push(
      `${Math.abs(ctx.vsAveragePct)}% below its 1-year average (${formatNaira(ctx.average)}).`,
    );
  }
  return lines;
}

export function ReportCard({
  card,
  premium = true,
  context = null,
}: {
  card: ReportCardData;
  premium?: boolean;
  context?: PriceContext | null;
}) {
  const metrics = premium ? card.metrics : card.metrics.slice(0, FREE_METRIC_COUNT);

  return (
    <section className="reportcard" aria-label="Automated report card">
      <header className="reportcard__head">
        <h2 className="reportcard__title">Report card</h2>
        <span className="reportcard__period">{card.period}</span>
      </header>

      {/* Factual status tally — general information, not a grade or advice (G2). */}
      <div
        className="reportcard__summary"
        role="img"
        aria-label={`${card.summary.good} healthy, ${card.summary.neutral} informational, ${card.summary.watch} watch readings`}
      >
        <span className="reportcard__sum reportcard__sum--good">
          <strong>{card.summary.good}</strong> Healthy
        </span>
        <span className="reportcard__sum reportcard__sum--neutral">
          <strong>{card.summary.neutral}</strong> Info
        </span>
        <span className="reportcard__sum reportcard__sum--watch">
          <strong>{card.summary.watch}</strong> Watch
        </span>
      </div>

      {context && (
        <div className="reportcard__context">
          <div className="reportcard__context-range">
            <span className="reportcard__context-label">1-year range</span>
            <span className="reportcard__context-band" aria-hidden>
              <span
                className="reportcard__context-marker"
                style={{
                  left: `${Math.max(0, Math.min(100, context.pctAboveLow === 0 && context.pctBelowHigh === 0 ? 50 : (context.latest - context.low) / Math.max(context.high - context.low, 1e-9) * 100))}%`,
                }}
              />
            </span>
            <span className="reportcard__context-ends">
              {formatNaira(context.low)} – {formatNaira(context.high)}
            </span>
          </div>
          <ul className="reportcard__context-notes">
            {contextLines(context).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {premium && card.flags.length > 0 && (
        <ul className="reportcard__flags">
          {card.flags.map((flag, i) => (
            <li key={i} className="reportcard__flag">
              {flag}
            </li>
          ))}
        </ul>
      )}

      <dl className="reportcard__metrics">
        {metrics.map((m) => (
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

      {!premium && card.metrics.length > FREE_METRIC_COUNT && (
        <p className="reportcard__locked">
          {card.metrics.length - FREE_METRIC_COUNT} more metrics, flags, and notes on{' '}
          <a href="/pricing">Premium</a>.
        </p>
      )}
    </section>
  );
}
