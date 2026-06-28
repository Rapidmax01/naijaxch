'use client';

/**
 * TrendChart — the centerpiece. Fluid, scrubbable, corporate-action-adjusted
 * EOD trend chart (spec §5.4 / trend-engine rules).
 *
 * Contract: receives a ready PriceSeries (already adjusted). It plots adjClose
 * only (G6 / TS1); it NEVER fetches or adjusts. All displayed numbers are
 * rounded via src/series formatters (TS3). Display values come from the series,
 * never an LLM (G1 / TS4).
 */

import { useMemo, useRef, useState } from 'react';
import type { PriceSeries } from '@/series/types';
import {
  DEFAULT_TIMEFRAME,
  TIMEFRAMES,
  formatDate,
  formatNaira,
  formatPct,
  sma,
  windowSeries,
  windowStats,
  type Timeframe,
} from '@/series';
import { buildGeometry, nearestIndex } from './geometry';

const VIEW_W = 720;
const VIEW_H = 240;

/** Timeframes gated behind Premium (full trend history — spec §7). */
const PREMIUM_TIMEFRAMES: Timeframe[] = ['5Y', 'MAX'];

/** Moving-average overlays (computed deterministically from adjClose — G1). */
const MOVING_AVERAGES = [
  { key: 'ma50', label: 'MA 50', period: 50, color: 'var(--gold)' },
  { key: 'ma200', label: 'MA 200', period: 200, color: '#3b5bdb' },
] as const;
const MA_COLOR: Record<string, string> = Object.fromEntries(
  MOVING_AVERAGES.map((m) => [m.key, m.color]),
);

type ChartType = 'line' | 'candles';

export interface TrendChartProps {
  series: PriceSeries;
  /** Display label (e.g. company name or "Portfolio"). */
  label: string;
  /** When false, 5Y/Max are shown as a blurred teaser with an upgrade CTA. */
  premium?: boolean;
  /** Offer the candlestick view (off for portfolio value, which has no OHLC). */
  allowCandles?: boolean;
}

export function TrendChart({ series, label, premium = true, allowCandles = true }: TrendChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [activeMAs, setActiveMAs] = useState<Set<string>>(() => new Set(['ma50']));
  const [chartType, setChartType] = useState<ChartType>('line');
  const svgRef = useRef<SVGSVGElement>(null);

  const showCandles = allowCandles && chartType === 'candles';

  const locked = !premium && PREMIUM_TIMEFRAMES.includes(timeframe);

  const windowed = useMemo(() => windowSeries(series, timeframe), [series, timeframe]);

  // Moving averages are computed over the FULL series (so trailing values are
  // correct), then sliced to the visible window.
  const maByKey = useMemo(() => {
    const closes = series.points.map((p) => p.adjClose);
    const wlen = windowed.points.length;
    const out: Record<string, (number | null)[]> = {};
    for (const ma of MOVING_AVERAGES) out[ma.key] = sma(closes, ma.period).slice(-wlen);
    return out;
  }, [series, windowed.points.length]);

  const overlays = useMemo(
    () =>
      MOVING_AVERAGES.filter((ma) => activeMAs.has(ma.key)).map((ma) => ({
        key: ma.key,
        values: maByKey[ma.key]!,
      })),
    [activeMAs, maByKey],
  );

  const geometry = useMemo(
    () =>
      buildGeometry(
        windowed.points,
        { width: VIEW_W, height: VIEW_H, padding: 12 },
        overlays,
        showCandles,
      ),
    [windowed, overlays, showCandles],
  );
  const stats = useMemo(
    () => windowStats(windowed, scrubIndex ?? undefined),
    [windowed, scrubIndex],
  );

  if (!stats || windowed.points.length === 0) {
    return <EmptyState label={label} />;
  }

  const isUp = stats.isUp;
  const color = isUp ? 'var(--up)' : 'var(--down)';
  const activePoint = windowed.points[scrubIndex ?? windowed.points.length - 1]!;

  function pointerToIndex(clientX: number): number {
    const svg = svgRef.current;
    if (!svg) return -1;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * VIEW_W;
    return nearestIndex(geometry.coords, x);
  }

  function handleMove(clientX: number) {
    if (locked) return; // no scrub on the teaser
    const i = pointerToIndex(clientX);
    if (i >= 0) setScrubIndex(i);
  }

  const cursor = scrubIndex != null ? geometry.coords[scrubIndex] : null;

  return (
    <section className="trendchart" aria-label={`${label} price trend`}>
      <header className="trendchart__head">
        <div className="trendchart__label">{label}</div>
        <div className="trendchart__price" style={{ color }}>
          {formatNaira(stats.latest)}
        </div>
        <div className="trendchart__change" style={{ color }}>
          {formatNaira(stats.changeAbs)} ({formatPct(stats.changePct)})
          <span className="trendchart__period">
            {scrubIndex != null ? formatDate(activePoint.date) : ` ${timeframe}`}
          </span>
        </div>
        {stats.lowVolume && (
          <div className="trendchart__hint" role="note">
            Thinly traded over this window — prices may move on low volume.
          </div>
        )}
      </header>

      <div className="trendchart__plot">
      <svg
        ref={svgRef}
        className={`trendchart__svg${locked ? ' is-locked' : ''}`}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}: ${formatNaira(stats.latest)}, ${formatPct(
          stats.changePct,
        )} over ${timeframe}.`}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setScrubIndex(null)}
        onTouchStart={(e) => handleMove(e.touches[0]!.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0]!.clientX)}
        onTouchEnd={() => setScrubIndex(null)}
      >
        <defs>
          <linearGradient id="tc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.22 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {/* Reference line at the window's starting price (faint dashed). */}
        <line
          x1={0}
          x2={VIEW_W}
          y1={geometry.baselineY}
          y2={geometry.baselineY}
          stroke="currentColor"
          strokeOpacity={0.3}
          strokeDasharray="3 5"
        />
        {showCandles ? (
          <g className="trendchart__candles">
            {geometry.candles.map((cd, i) => {
              const c = cd.up ? 'var(--up)' : 'var(--down)';
              const bodyTop = Math.min(cd.openY, cd.closeY);
              const bodyH = Math.max(1, Math.abs(cd.openY - cd.closeY));
              return (
                <g key={i}>
                  <line x1={cd.x} x2={cd.x} y1={cd.highY} y2={cd.lowY} stroke={c} strokeWidth={1} />
                  <rect
                    x={cd.x - cd.halfWidth}
                    y={bodyTop}
                    width={cd.halfWidth * 2}
                    height={bodyH}
                    fill={c}
                  />
                </g>
              );
            })}
          </g>
        ) : (
          <>
            <path d={geometry.area} fill="url(#tc-area)" />
            <path
              d={geometry.line}
              fill="none"
              stroke={color}
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}

        {geometry.overlays.map((o) => (
          <path
            key={o.key}
            d={o.d}
            fill="none"
            stroke={MA_COLOR[o.key]}
            strokeWidth={1.4}
            strokeOpacity={0.95}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {cursor && (
          <g className="trendchart__crosshair">
            <line x1={cursor.x} x2={cursor.x} y1={0} y2={VIEW_H} stroke={color} strokeOpacity={0.4} />
            <circle cx={cursor.x} cy={cursor.y} r={4} fill={color} />
          </g>
        )}
      </svg>
        {locked && (
          <div className="trendchart__lock">
            <p>Full history (5Y / Max) is a Premium feature.</p>
            <a href="/pricing" className="upgrade-prompt__cta">
              See plans →
            </a>
          </div>
        )}
      </div>

      <div className="trendchart__controls">
        <div className="trendchart__timeframes" role="group" aria-label="Timeframe">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              className={`trendchart__tf${tf === timeframe ? ' is-active' : ''}`}
              aria-pressed={tf === timeframe}
              onClick={() => {
                setTimeframe(tf);
                setScrubIndex(null);
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="trendchart__tools">
          {allowCandles && (
            <div className="trendchart__types" role="group" aria-label="Chart type">
              {(['line', 'candles'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`trendchart__type${chartType === t ? ' is-active' : ''}`}
                  aria-pressed={chartType === t}
                  onClick={() => setChartType(t)}
                >
                  {t === 'line' ? 'Line' : 'Candles'}
                </button>
              ))}
            </div>
          )}
          <div className="trendchart__indicators" role="group" aria-label="Moving averages">
            {MOVING_AVERAGES.map((ma) => {
            const on = activeMAs.has(ma.key);
            return (
              <button
                key={ma.key}
                type="button"
                className={`trendchart__ind${on ? ' is-on' : ''}`}
                aria-pressed={on}
                style={{ ['--ma' as string]: ma.color }}
                onClick={() =>
                  setActiveMAs((prev) => {
                    const next = new Set(prev);
                    if (next.has(ma.key)) next.delete(ma.key);
                    else next.add(ma.key);
                    return next;
                  })
                }
              >
                <span className="trendchart__ind-dot" aria-hidden />
                {ma.label}
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Screen-reader summary (accessibility, spec §5.4). */}
      <p className="sr-only">
        {label} adjusted closing price is {formatNaira(stats.latest)}, a change of{' '}
        {formatNaira(stats.changeAbs)} ({formatPct(stats.changePct)}) over the {timeframe} window.
        Chart plots corporate-action-adjusted end-of-day prices.
      </p>
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <section className="trendchart trendchart--empty" aria-label={`${label} price trend`}>
      <div className="trendchart__label">{label}</div>
      <p className="trendchart__empty">No price data available yet.</p>
    </section>
  );
}
