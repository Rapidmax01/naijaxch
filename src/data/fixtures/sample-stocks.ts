/**
 * Sample NGX data for local development and demos (~60 names, the MVP target).
 *
 * Ticker/name/sector are real NGX reference data (public). Prices and
 * fundamentals are DETERMINISTIC SYNTHETIC PLACEHOLDERS — not real NGX figures
 * (no licensed feed; G3). Generated from a per-ticker hash so tests/snapshots
 * are stable, and tuned so the rules engine sees variety (loss-makers, high
 * debt, negative equity, low dividend cover). Swap in the licensed delayed/EOD
 * feed via src/ingestion (NgxMarketDataSource) for real data.
 */

import type {
  Company,
  CorporateAction,
  Disclosure,
  DisclosureType,
  Fundamentals,
  RawPricePoint,
  Ticker,
} from '../types';

/** @deprecated use `Company` from `@/data/types` — kept for existing imports. */
export type SampleCompany = Company;

interface Seed {
  ticker: string;
  name: string;
  sector: string;
  /** Approximate recent price in Naira (placeholder anchor for the series). */
  basePrice: number;
}

const SEEDS: Seed[] = [
  // Financial Services
  { ticker: 'GTCO', name: 'Guaranty Trust Holding Co Plc', sector: 'Financial Services', basePrice: 46 },
  { ticker: 'ZENITHBANK', name: 'Zenith Bank Plc', sector: 'Financial Services', basePrice: 41 },
  { ticker: 'UBA', name: 'United Bank for Africa Plc', sector: 'Financial Services', basePrice: 28 },
  { ticker: 'ACCESSCORP', name: 'Access Holdings Plc', sector: 'Financial Services', basePrice: 22 },
  { ticker: 'FBNH', name: 'FBN Holdings Plc', sector: 'Financial Services', basePrice: 27 },
  { ticker: 'STANBIC', name: 'Stanbic IBTC Holdings Plc', sector: 'Financial Services', basePrice: 58 },
  { ticker: 'FIDELITYBK', name: 'Fidelity Bank Plc', sector: 'Financial Services', basePrice: 16 },
  { ticker: 'FCMB', name: 'FCMB Group Plc', sector: 'Financial Services', basePrice: 9 },
  { ticker: 'STERLINGNG', name: 'Sterling Financial Holdings Plc', sector: 'Financial Services', basePrice: 4.5 },
  { ticker: 'WEMABANK', name: 'Wema Bank Plc', sector: 'Financial Services', basePrice: 9.2 },
  { ticker: 'JAIZBANK', name: 'Jaiz Bank Plc', sector: 'Financial Services', basePrice: 2.6 },
  { ticker: 'ETI', name: 'Ecobank Transnational Inc', sector: 'Financial Services', basePrice: 24 },

  // Industrial Goods
  { ticker: 'DANGCEM', name: 'Dangote Cement Plc', sector: 'Industrial Goods', basePrice: 480 },
  { ticker: 'BUACEMENT', name: 'BUA Cement Plc', sector: 'Industrial Goods', basePrice: 96 },
  { ticker: 'WAPCO', name: 'Lafarge Africa Plc', sector: 'Industrial Goods', basePrice: 38 },
  { ticker: 'CUTIX', name: 'Cutix Plc', sector: 'Industrial Goods', basePrice: 2.5 },
  { ticker: 'BERGER', name: 'Berger Paints Nigeria Plc', sector: 'Industrial Goods', basePrice: 12 },

  // Consumer Goods
  { ticker: 'NESTLE', name: 'Nestle Nigeria Plc', sector: 'Consumer Goods', basePrice: 950 },
  { ticker: 'NB', name: 'Nigerian Breweries Plc', sector: 'Consumer Goods', basePrice: 32 },
  { ticker: 'GUINNESS', name: 'Guinness Nigeria Plc', sector: 'Consumer Goods', basePrice: 62 },
  { ticker: 'FLOURMILL', name: 'Flour Mills of Nigeria Plc', sector: 'Consumer Goods', basePrice: 38 },
  { ticker: 'DANGSUGAR', name: 'Dangote Sugar Refinery Plc', sector: 'Consumer Goods', basePrice: 38 },
  { ticker: 'UNILEVER', name: 'Unilever Nigeria Plc', sector: 'Consumer Goods', basePrice: 16 },
  { ticker: 'NASCON', name: 'NASCON Allied Industries Plc', sector: 'Consumer Goods', basePrice: 48 },
  { ticker: 'CADBURY', name: 'Cadbury Nigeria Plc', sector: 'Consumer Goods', basePrice: 22 },
  { ticker: 'INTBREW', name: 'International Breweries Plc', sector: 'Consumer Goods', basePrice: 8 },
  { ticker: 'HONYFLOUR', name: 'Honeywell Flour Mills Plc', sector: 'Consumer Goods', basePrice: 9 },
  { ticker: 'PZ', name: 'PZ Cussons Nigeria Plc', sector: 'Consumer Goods', basePrice: 25 },
  { ticker: 'BUAFOODS', name: 'BUA Foods Plc', sector: 'Consumer Goods', basePrice: 360 },
  { ticker: 'NNFM', name: 'Northern Nigeria Flour Mills Plc', sector: 'Consumer Goods', basePrice: 60 },

  // Telecommunications
  { ticker: 'MTNN', name: 'MTN Nigeria Communications Plc', sector: 'Telecoms', basePrice: 200 },
  { ticker: 'AIRTELAFRI', name: 'Airtel Africa Plc', sector: 'Telecoms', basePrice: 2200 },

  // Oil & Gas
  { ticker: 'SEPLAT', name: 'Seplat Energy Plc', sector: 'Oil & Gas', basePrice: 4200 },
  { ticker: 'TOTAL', name: 'TotalEnergies Marketing Nigeria Plc', sector: 'Oil & Gas', basePrice: 620 },
  { ticker: 'CONOIL', name: 'Conoil Plc', sector: 'Oil & Gas', basePrice: 250 },
  { ticker: 'OANDO', name: 'Oando Plc', sector: 'Oil & Gas', basePrice: 60 },
  { ticker: 'ETERNA', name: 'Eterna Plc', sector: 'Oil & Gas', basePrice: 22 },
  { ticker: 'ARDOVA', name: 'Ardova Plc', sector: 'Oil & Gas', basePrice: 32 },
  { ticker: 'MRS', name: 'MRS Oil Nigeria Plc', sector: 'Oil & Gas', basePrice: 180 },

  // Insurance
  { ticker: 'AIICO', name: 'AIICO Insurance Plc', sector: 'Insurance', basePrice: 1.2 },
  { ticker: 'MANSARD', name: 'AXA Mansard Insurance Plc', sector: 'Insurance', basePrice: 5.5 },
  { ticker: 'CORNERST', name: 'Cornerstone Insurance Plc', sector: 'Insurance', basePrice: 2.8 },
  { ticker: 'NEM', name: 'NEM Insurance Plc', sector: 'Insurance', basePrice: 9.5 },
  { ticker: 'WAPIC', name: 'Wapic Insurance Plc', sector: 'Insurance', basePrice: 0.9 },
  { ticker: 'LASACO', name: 'LASACO Assurance Plc', sector: 'Insurance', basePrice: 2.4 },

  // Agriculture
  { ticker: 'OKOMUOIL', name: 'The Okomu Oil Palm Company Plc', sector: 'Agriculture', basePrice: 320 },
  { ticker: 'PRESCO', name: 'Presco Plc', sector: 'Agriculture', basePrice: 360 },
  { ticker: 'LIVESTOCK', name: 'Livestock Feeds Plc', sector: 'Agriculture', basePrice: 2.6 },
  { ticker: 'FTNCOCOA', name: 'FTN Cocoa Processors Plc', sector: 'Agriculture', basePrice: 1.8 },

  // Conglomerates & Services
  { ticker: 'TRANSCORP', name: 'Transnational Corporation Plc', sector: 'Conglomerates', basePrice: 12 },
  { ticker: 'UACN', name: 'UAC of Nigeria Plc', sector: 'Conglomerates', basePrice: 16 },
  { ticker: 'JBERGER', name: 'Julius Berger Nigeria Plc', sector: 'Construction', basePrice: 80 },
  { ticker: 'TRANSCOHOT', name: 'Transcorp Hotels Plc', sector: 'Services', basePrice: 95 },
  { ticker: 'CAVERTON', name: 'Caverton Offshore Support Group Plc', sector: 'Services', basePrice: 1.7 },
  { ticker: 'NAHCO', name: 'Nigerian Aviation Handling Company Plc', sector: 'Services', basePrice: 45 },
  { ticker: 'UPDC', name: 'UPDC Plc', sector: 'Real Estate', basePrice: 1.5 },

  // ICT & Healthcare
  { ticker: 'CWG', name: 'CWG Plc', sector: 'ICT', basePrice: 7 },
  { ticker: 'CHAMS', name: 'Chams Holding Company Plc', sector: 'ICT', basePrice: 1.8 },
  { ticker: 'FIDSON', name: 'Fidson Healthcare Plc', sector: 'Healthcare', basePrice: 16 },
  { ticker: 'MAYBAKER', name: 'May & Baker Nigeria Plc', sector: 'Healthcare', basePrice: 7 },
  { ticker: 'NEIMETH', name: 'Neimeth International Pharmaceuticals Plc', sector: 'Healthcare', basePrice: 2.2 },
];

export const SAMPLE_COMPANIES: SampleCompany[] = SEEDS.map((s) => ({
  ticker: s.ticker,
  name: s.name,
  sector: s.sector,
}));

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Stable per-ticker hash (FNV-1a) for deterministic variation. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Trading days ending 2024-12-31, weekdays only (fixed seed date). */
function tradingDays(count: number): string[] {
  const days: string[] = [];
  const cursor = new Date(Date.UTC(2024, 11, 31));
  while (days.length < count) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days.reverse();
}

// ~5 years of EOD history (starts ~late 2019) so 5Y/Max charts are populated and
// the fundamentals history (FY2019–FY2023) overlaps the price series for the
// multi-year valuation context. Corporate-action ex-dates (chosen by index
// below) apply by date, so the back-adjustment stays continuous (G6).
const DAYS = tradingDays(1320);

/** Deterministic price path: trend + sine wave, no randomness. */
function syntheticCloses(base: number, amplitude: number, drift: number): number[] {
  return DAYS.map((_, i) => {
    const wave = Math.sin(i / 18) * amplitude;
    const trend = (i / DAYS.length) * drift;
    return round2(Math.max(0.01, base + wave + trend));
  });
}

function buildRaw(ticker: Ticker, closes: number[]): RawPricePoint[] {
  const h = hash(ticker);
  return DAYS.map((date, i) => {
    const close = closes[i]!;
    const prev = closes[i - 1] ?? close;
    // Synthetic OHLC: open sits between yesterday's and today's close; the day's
    // high/low bracket the open/close by a small deterministic range.
    const open = round2((prev + close) / 2);
    const hi = round2(Math.max(open, close) * (1 + ((h + i * 7) % 9) / 400)); // up to +2%
    const lo = round2(Math.min(open, close) * (1 - ((h + i * 13) % 9) / 400)); // down to -2%
    return {
      ticker,
      date,
      open,
      high: hi,
      low: Math.max(0.01, lo),
      close,
      volume: 25_000 + ((h + i * 37) % 250_000),
    };
  });
}

/** Scale every price field of a row by a corporate-action factor. */
function scaleRow(p: RawPricePoint, factor: number): void {
  p.open = round2(p.open * factor);
  p.high = round2(p.high * factor);
  p.low = round2(p.low * factor);
  p.close = round2(p.close * factor);
}

export const SAMPLE_RAW_PRICES: Record<Ticker, RawPricePoint[]> = {};
for (const s of SEEDS) {
  const h = hash(s.ticker);
  const amplitude = s.basePrice * (0.04 + (h % 16) / 100); // 4–20% wave
  const drift = (h % 2 ? 1 : -1) * s.basePrice * ((h % 22) / 100); // ±0–22% trend
  SAMPLE_RAW_PRICES[s.ticker] = buildRaw(s.ticker, syntheticCloses(s.basePrice, amplitude, drift));
}

/** Deterministic placeholder fundamentals (varied to exercise the rules engine). */
function genFundamentals(s: Seed, h: number): Fundamentals {
  const shareCount = (1 + (h % 30)) * 1e9; // 1bn–30bn shares
  const revenue = (50 + (h % 900)) * 1e9; // ₦50bn–₦950bn
  const marginPct = (h % 26) - 4; // -4% … 21%
  const netIncome = Math.round((revenue * marginPct) / 100);
  const eps = netIncome / shareCount;
  const payout = 0.25 + (h % 6) / 10; // 0.25–0.75
  const dividendPerShare = eps > 0 ? round2(eps * payout) : 0;
  const totalEquity = Math.round(revenue * (0.5 + (h % 8) / 10));
  const totalDebt = Math.round(totalEquity * ((h % 25) / 10)); // 0–2.4×
  return {
    ticker: s.ticker,
    period: 'FY2023',
    revenue,
    netIncome,
    shareCount,
    dividendPerShare,
    totalEquity,
    totalDebt,
  };
}

/**
 * Build a 5-year history (FY2019…FY2023) ending exactly at `anchor` (the latest
 * period — so existing report-card stories are unchanged). Older years are the
 * anchor deflated by a deterministic annual growth rate, giving a realistic
 * upward trend for the growth metrics (proposal 0006). Ascending order.
 */
function backcast(anchor: Fundamentals, h: number): Fundamentals[] {
  const years = [2019, 2020, 2021, 2022, 2023];
  const growth = 1 + ((h % 15) + 3) / 100; // 3%–17% annual growth
  const n = years.length;
  return years.map((y, i) => {
    const factor = Math.pow(growth, -(n - 1 - i)); // 1 for the latest year
    return {
      ticker: anchor.ticker,
      period: `FY${y}`,
      revenue: Math.round(anchor.revenue * factor),
      netIncome: Math.round(anchor.netIncome * factor),
      shareCount: anchor.shareCount, // held constant (placeholder)
      dividendPerShare: round2(anchor.dividendPerShare * factor),
      totalEquity: Math.round(anchor.totalEquity * factor),
      totalDebt: Math.round(anchor.totalDebt * factor),
    };
  });
}

export const SAMPLE_FUNDAMENTALS: Record<Ticker, Fundamentals[]> = {};
for (const s of SEEDS) {
  const h = hash(s.ticker);
  SAMPLE_FUNDAMENTALS[s.ticker] = backcast(genFundamentals(s, h), h);
}

// Hand-set a few latest-period anchors so the demos always show specific
// report-card stories; each gets the same back-cast 5-year history.
// GTCO — dividend cover below 1 (declared dividend exceeds EPS).
SAMPLE_FUNDAMENTALS.GTCO = backcast(
  {
    ticker: 'GTCO',
    period: 'FY2023',
    revenue: 1_186_000_000_000,
    netIncome: 539_000_000_000,
    shareCount: 29_430_000_000,
    dividendPerShare: 20, // EPS ≈ ₦18.31 → cover ≈ 0.92 (watch)
    totalEquity: 1_500_000_000_000,
    totalDebt: 400_000_000_000,
  },
  hash('GTCO'),
);
// MTNN — a loss-making period with negative equity.
SAMPLE_FUNDAMENTALS.MTNN = backcast(
  {
    ticker: 'MTNN',
    period: 'FY2023',
    revenue: 2_470_000_000_000,
    netIncome: -137_000_000_000,
    shareCount: 20_350_000_000,
    dividendPerShare: 0,
    totalEquity: -40_000_000_000,
    totalDebt: 1_100_000_000_000,
  },
  hash('MTNN'),
);

// --- Corporate actions (with the matching raw ex-date step-down so the
// adjusted series stays continuous, G6). Bonus/split: factor = M/(M+N).

function applyBonusOrSplit(
  ticker: Ticker,
  exDate: string,
  type: 'bonus' | 'split',
  newShares: number,
  perHeld: number,
): CorporateAction {
  const factor = perHeld / (perHeld + newShares);
  for (const p of SAMPLE_RAW_PRICES[ticker]!) {
    if (p.date >= exDate) scaleRow(p, factor);
  }
  return { ticker, exDate, type, terms: { newShares, perHeld } };
}

function applyRights(
  ticker: Ticker,
  exDate: string,
  newShares: number,
  perHeld: number,
  subPriceFactor: number,
): CorporateAction {
  const series = SAMPLE_RAW_PRICES[ticker]!;
  const idx = series.findIndex((p) => p.date >= exDate);
  const cumPrice = series[idx - 1]!.close; // last close before ex
  const subscriptionPrice = round2(cumPrice * subPriceFactor);
  const terp = (perHeld * cumPrice + newShares * subscriptionPrice) / (perHeld + newShares);
  const factor = terp / cumPrice;
  for (let i = idx; i < series.length; i++) scaleRow(series[i]!, factor);
  return { ticker, exDate, type: 'rights', terms: { newShares, perHeld, subscriptionPrice, cumPrice } };
}

const MID = Math.floor(DAYS.length / 2);

export const SAMPLE_CORPORATE_ACTIONS: Record<Ticker, CorporateAction[]> = {
  GTCO: [applyBonusOrSplit('GTCO', DAYS[MID]!, 'bonus', 1, 10)],
  BUACEMENT: [applyBonusOrSplit('BUACEMENT', DAYS[90]!, 'bonus', 1, 5)],
  DANGSUGAR: [applyRights('DANGSUGAR', DAYS[170]!, 1, 4, 0.7)],
};

// --- Company disclosures / filings (proposal 0009). Deterministic placeholders
// standing in for the licensed NGX disclosure feed (G3/#6). Newest-first.
function mkDisclosure(
  ticker: Ticker,
  type: DisclosureType,
  title: string,
  date: string,
): Disclosure {
  return {
    ticker,
    title,
    type,
    publishedAt: `${date}T09:00:00.000Z`,
    sourceUrl: `https://ngxgroup.com/issuers/${ticker.toLowerCase()}/disclosures/${type}-${date}`,
  };
}

/** Shift an ISO date by `days` (placeholder date spread so the feed looks real). */
function shiftDate(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const SAMPLE_DISCLOSURES: Record<Ticker, Disclosure[]> = {};
for (const s of SEEDS) {
  const h = hash(s.ticker);
  // Per-company offset so filings don't all land on the same day (homepage feed).
  const off = h % 70; // 0–69 days
  const items: Disclosure[] = [
    mkDisclosure(s.ticker, 'results', 'Audited Full-Year Results FY2023', shiftDate('2024-03-12', -off)),
    mkDisclosure(s.ticker, 'dividend', 'Notice of Dividend Declaration', shiftDate('2024-03-14', -off)),
  ];
  if (h % 2 === 0) {
    items.push(
      mkDisclosure(s.ticker, 'board', 'Change to the Board of Directors', shiftDate('2024-01-22', -off)),
    );
  }
  if (h % 3 === 0) {
    items.push(
      mkDisclosure(
        s.ticker,
        'material-event',
        'Notification of a Material Development',
        shiftDate('2024-09-05', -off),
      ),
    );
  }
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)); // newest first
  SAMPLE_DISCLOSURES[s.ticker] = items;
}
