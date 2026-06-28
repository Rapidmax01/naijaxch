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
  bollinger,
  ema,
  formatCompact,
  formatDate,
  formatNaira,
  formatPct,
  macd,
  rsi,
  sma,
  windowSeries,
  windowStats,
  type Timeframe,
} from '@/series';
import { buildGeometry, buildOscillator, buildVolumeBars, nearestIndex } from './geometry';

const VIEW_W = 720;
const VIEW_H = 240;
const VOL_H = 64;
const OSC_H = 96;

/** Oscillator sub-panel: a momentum study drawn below the price plot. */
type Oscillator = 'off' | 'rsi' | 'macd';
const RSI_PERIOD = 14;
const RSI_COLOR = '#5f3dc4';
const MACD_COLOR = '#1c7ed6';
const MACD_SIGNAL_COLOR = '#e8590c';

/** Timeframes gated behind Premium (full trend history — spec §7). */
const PREMIUM_TIMEFRAMES: Timeframe[] = ['5Y', 'MAX'];

/** Line-overlay indicators (computed deterministically from adjClose — G1). */
const LINE_INDICATORS = [
  { key: 'ma50', label: 'MA 50', color: 'var(--gold)', compute: (c: number[]) => sma(c, 50) },
  { key: 'ma200', label: 'MA 200', color: '#3b5bdb', compute: (c: number[]) => sma(c, 200) },
  { key: 'ema20', label: 'EMA 20', color: '#0b7285', compute: (c: number[]) => ema(c, 20) },
] as const;
const BB_PERIOD = 20;
const BB_COLOR = '#6741d9';
const OVERLAY_COLOR: Record<string, string> = {
  ...Object.fromEntries(LINE_INDICATORS.map((m) => [m.key, m.color])),
  bbmid: BB_COLOR,
};

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
  const [activeInd, setActiveInd] = useState<Set<string>>(() => new Set(['ma50']));
  const [showBB, setShowBB] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showVolume, setShowVolume] = useState(false);
  const [oscillator, setOscillator] = useState<Oscillator>('off');
  const svgRef = useRef<SVGSVGElement>(null);

  const showCandles = allowCandles && chartType === 'candles';
  const showVol = allowCandles && showVolume;

  const locked = !premium && PREMIUM_TIMEFRAMES.includes(timeframe);

  const windowed = useMemo(() => windowSeries(series, timeframe), [series, timeframe]);

  // Indicators are computed over the FULL series (so trailing values are
  // correct), then sliced to the visible window.
  const wlen = windowed.points.length;
  const lineByKey = useMemo(() => {
    const closes = series.points.map((p) => p.adjClose);
    const out: Record<string, (number | null)[]> = {};
    for (const ind of LINE_INDICATORS) out[ind.key] = ind.compute(closes).slice(-wlen);
    return out;
  }, [series, wlen]);

  const bbBands = useMemo(() => {
    if (!showBB) return null;
    const closes = series.points.map((p) => p.adjClose);
    const b = bollinger(closes, BB_PERIOD, 2);
    return {
      middle: b.middle.slice(-wlen),
      upper: b.upper.slice(-wlen),
      lower: b.lower.slice(-wlen),
    };
  }, [series, wlen, showBB]);

  const overlays = useMemo(() => {
    const o: { key: string; values: (number | null)[] }[] = LINE_INDICATORS.filter((ind) =>
      activeInd.has(ind.key),
    ).map((ind) => ({ key: ind.key, values: lineByKey[ind.key]! }));
    if (bbBands) o.push({ key: 'bbmid', values: bbBands.middle });
    return o;
  }, [activeInd, lineByKey, bbBands]);

  const bands = useMemo(
    () => (bbBands ? [{ key: 'bb', upper: bbBands.upper, lower: bbBands.lower }] : []),
    [bbBands],
  );

  const geometry = useMemo(
    () =>
      buildGeometry(
        windowed.points,
        { width: VIEW_W, height: VIEW_H, padding: 12 },
        overlays,
        showCandles,
        bands,
      ),
    [windowed, overlays, showCandles, bands],
  );

  const volumeBars = useMemo(
    () => (showVol ? buildVolumeBars(windowed.points, { width: VIEW_W, height: VOL_H, padding: 12 }) : []),
    [showVol, windowed],
  );
  // Oscillator (RSI or MACD) — computed over the full series (so the smoothing
  // is warmed up), then sliced to the window. Deterministic math (G1 / TS4).
  const osc = useMemo(() => {
    if (oscillator === 'off') return null;
    const closes = series.points.map((p) => p.adjClose);
    if (oscillator === 'rsi') {
      const values = rsi(closes, RSI_PERIOD).slice(-wlen);
      const geom = buildOscillator(
        { width: VIEW_W, height: OSC_H, padding: 12 },
        { lines: [{ key: 'rsi', values }], domain: [0, 100], guides: [30, 50, 70] },
      );
      return { kind: 'rsi' as const, geom, rsi: values };
    }
    const m = macd(closes);
    const macdLine = m.macd.slice(-wlen);
    const signal = m.signal.slice(-wlen);
    const histogram = m.histogram.slice(-wlen);
    const geom = buildOscillator(
      { width: VIEW_W, height: OSC_H, padding: 12 },
      {
        lines: [
          { key: 'macd', values: macdLine },
          { key: 'signal', values: signal },
        ],
        histogram,
        guides: [0],
      },
    );
    return { kind: 'macd' as const, geom, macd: macdLine, signal, histogram };
  }, [oscillator, series, wlen]);

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
        {allowCandles && (
          <dl className="trendchart__ohlc" aria-label="Open, high, low, close, volume">
            <div>
              <dt>O</dt>
              <dd>{formatNaira(activePoint.adjOpen)}</dd>
            </div>
            <div>
              <dt>H</dt>
              <dd>{formatNaira(activePoint.adjHigh)}</dd>
            </div>
            <div>
              <dt>L</dt>
              <dd>{formatNaira(activePoint.adjLow)}</dd>
            </div>
            <div>
              <dt>C</dt>
              <dd>{formatNaira(activePoint.adjClose)}</dd>
            </div>
            <div>
              <dt>Vol</dt>
              <dd>{formatCompact(activePoint.volume)}</dd>
            </div>
          </dl>
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
        {geometry.bands.map((b) => (
          <path key={b.key} d={b.fill} fill={BB_COLOR} fillOpacity={0.08} stroke="none" />
        ))}
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
            stroke={OVERLAY_COLOR[o.key]}
            strokeWidth={o.key === 'bbmid' ? 1 : 1.4}
            strokeDasharray={o.key === 'bbmid' ? '4 3' : undefined}
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

      {showVol && (
        <svg
          className="trendchart__volume"
          viewBox={`0 0 ${VIEW_W} ${VOL_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Daily volume"
        >
          {volumeBars.map((b, i) => (
            <rect
              key={i}
              x={b.x - b.halfWidth}
              y={b.topY}
              width={b.halfWidth * 2}
              height={Math.max(0.5, b.bottomY - b.topY)}
              fill={b.up ? 'var(--up)' : 'var(--down)'}
              fillOpacity={0.5}
            />
          ))}
          {cursor && (
            <line x1={cursor.x} x2={cursor.x} y1={0} y2={VOL_H} stroke="var(--faint)" strokeOpacity={0.5} />
          )}
        </svg>
      )}

      {osc && (
        <div className="trendchart__osc">
          <div className="trendchart__osc-cap">
            {osc.kind === 'rsi' ? (
              <span>
                RSI ({RSI_PERIOD}){' '}
                <strong>{osc.rsi[scrubIndex ?? wlen - 1] ?? '—'}</strong>
              </span>
            ) : (
              <span>
                MACD (12, 26, 9) <strong style={{ color: MACD_COLOR }}>{osc.macd[scrubIndex ?? wlen - 1] ?? '—'}</strong>{' '}
                <span style={{ color: MACD_SIGNAL_COLOR }}>
                  signal {osc.signal[scrubIndex ?? wlen - 1] ?? '—'}
                </span>
              </span>
            )}
          </div>
          <svg
            className="trendchart__osc-svg"
            viewBox={`0 0 ${VIEW_W} ${OSC_H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={osc.kind === 'rsi' ? 'Relative Strength Index' : 'MACD'}
          >
            {osc.geom.guides.map((g) => (
              <g key={g.level}>
                <line
                  x1={0}
                  x2={VIEW_W}
                  y1={g.y}
                  y2={g.y}
                  stroke="currentColor"
                  strokeOpacity={g.level === 0 ? 0.35 : 0.18}
                  strokeDasharray={g.level === 0 ? undefined : '3 5'}
                />
              </g>
            ))}
            {osc.kind === 'macd' &&
              osc.geom.bars.map((b, i) => (
                <rect
                  key={i}
                  x={b.x - b.halfWidth}
                  y={Math.min(b.zeroY, b.valueY)}
                  width={b.halfWidth * 2}
                  height={Math.max(0.5, Math.abs(b.zeroY - b.valueY))}
                  fill={b.positive ? 'var(--up)' : 'var(--down)'}
                  fillOpacity={0.45}
                />
              ))}
            {osc.geom.lines.map((l) => (
              <path
                key={l.key}
                d={l.d}
                fill="none"
                stroke={
                  l.key === 'rsi' ? RSI_COLOR : l.key === 'signal' ? MACD_SIGNAL_COLOR : MACD_COLOR
                }
                strokeWidth={1.6}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {cursor && (
              <line x1={cursor.x} x2={cursor.x} y1={0} y2={OSC_H} stroke="var(--faint)" strokeOpacity={0.5} />
            )}
          </svg>
        </div>
      )}

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
          <div className="trendchart__indicators" role="group" aria-label="Indicators">
            {LINE_INDICATORS.map((ind) => {
              const on = activeInd.has(ind.key);
              return (
                <button
                  key={ind.key}
                  type="button"
                  className={`trendchart__ind${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  style={{ ['--ma' as string]: ind.color }}
                  onClick={() =>
                    setActiveInd((prev) => {
                      const next = new Set(prev);
                      if (next.has(ind.key)) next.delete(ind.key);
                      else next.add(ind.key);
                      return next;
                    })
                  }
                >
                  <span className="trendchart__ind-dot" aria-hidden />
                  {ind.label}
                </button>
              );
            })}
            <button
              type="button"
              className={`trendchart__ind${showBB ? ' is-on' : ''}`}
              aria-pressed={showBB}
              style={{ ['--ma' as string]: BB_COLOR }}
              onClick={() => setShowBB((v) => !v)}
            >
              <span className="trendchart__ind-dot" aria-hidden />
              BB
            </button>
          </div>
          {allowCandles && (
            <button
              type="button"
              className={`trendchart__ind${showVolume ? ' is-on' : ''}`}
              aria-pressed={showVolume}
              style={{ ['--ma' as string]: 'var(--muted)' }}
              onClick={() => setShowVolume((v) => !v)}
            >
              <span className="trendchart__ind-dot" aria-hidden />
              Vol
            </button>
          )}
          <div className="trendchart__osc-sel" role="group" aria-label="Oscillator">
            {(['off', 'rsi', 'macd'] as const).map((o) => (
              <button
                key={o}
                type="button"
                className={`trendchart__type${oscillator === o ? ' is-active' : ''}`}
                aria-pressed={oscillator === o}
                onClick={() => setOscillator(o)}
              >
                {o === 'off' ? 'No osc' : o.toUpperCase()}
              </button>
            ))}
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
