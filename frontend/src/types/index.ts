export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  telegram_chat_id?: number
  is_active: boolean
  is_verified: boolean
  is_admin: boolean
  auth_provider?: string
  created_at: string
  last_login?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface ExchangePrice {
  exchange: string
  display_name: string
  crypto: string
  fiat: string
  buy_price: number
  sell_price: number
  spread: number
  spread_percent: number
  volume_24h?: number
  data_source?: 'live' | 'cached' | 'sample'
  updated_at: string
}

export interface AllPricesResponse {
  crypto: string
  fiat: string
  exchanges: ExchangePrice[]
  best_buy?: ExchangePrice
  best_sell?: ExchangePrice
  exchange_statuses?: Record<string, string>
  updated_at: string
}

export interface FeesBreakdown {
  buy_fee: number
  sell_fee: number
  withdrawal_fee: number
  total: number
}

export interface ArbitrageOpportunity {
  id?: string
  crypto: string
  buy_exchange: string
  sell_exchange: string
  buy_price: number
  sell_price: number
  gross_spread: number
  gross_spread_percent: number
  fees: FeesBreakdown
  net_profit: number
  net_profit_percent: number
  is_profitable: boolean
  min_trade_amount?: number
  max_trade_amount?: number
  detected_at?: string
}

export interface OpportunitiesResponse {
  opportunities: ArbitrageOpportunity[]
  total: number
  updated_at: string
}

export interface CalculateRequest {
  buy_exchange: string
  sell_exchange: string
  crypto: string
  trade_amount_ngn: number
}

export interface CalculateResponse extends ArbitrageOpportunity {
  trade_amount_ngn: number
  crypto_amount: number
  roi: number
}

export interface Alert {
  id: string
  user_id: string
  crypto?: string
  min_spread_percent: number
  buy_exchanges?: string[]
  sell_exchanges?: string[]
  is_active: boolean
  notify_telegram: boolean
  notify_email: boolean
  created_at: string
}

// NGX Radar Types
export interface Stock {
  id: string
  symbol: string
  name: string
  sector?: string
  current_price?: number
  change?: number
  change_percent?: number
  volume?: number
  market_cap?: number
  pe_ratio?: number
  dividend_yield?: number
  high_52w?: number
  low_52w?: number
  is_active: boolean
}

export interface StockPrice {
  date: string
  open_price?: number
  high_price?: number
  low_price?: number
  close_price: number
  volume?: number
}

export interface StockDetail extends Stock {
  prices: StockPrice[]
}

export interface MarketSummary {
  asi: number
  asi_change: number
  asi_change_percent: number
  market_cap: number
  volume: number
  value: number
  deals: number
  date: string
  top_gainers: Stock[]
  top_losers: Stock[]
  most_active: Stock[]
}

export interface ScreenerFilters {
  sector?: string
  min_price?: number
  max_price?: number
  min_change_percent?: number
  max_change_percent?: number
  min_volume?: number
  min_market_cap?: number
  max_pe_ratio?: number
  min_dividend_yield?: number
  sort_by: string
  sort_order: 'asc' | 'desc'
  limit: number
  offset: number
}

export interface ScreenerResponse {
  stocks: Stock[]
  total: number
  filters_applied: ScreenerFilters
}

export interface Watchlist {
  id: string
  name: string
  stocks: Stock[]
  created_at: string
}

export interface StockAlert {
  id: string
  stock_symbol: string
  stock_name: string
  alert_type: 'price_above' | 'price_below' | 'percent_change'
  target_value: number
  current_price?: number
  is_active: boolean
  is_triggered: boolean
  triggered_at?: string
  notify_telegram: boolean
  notify_email: boolean
  created_at: string
}

export interface Dividend {
  id: string
  stock_symbol: string
  stock_name: string
  dividend_type: string
  amount_per_share: number
  qualification_date?: string
  payment_date?: string
  year?: number
}

// P2P Comparator Types
export interface P2PComparison {
  crypto: string
  cheapest_buy: ExchangePrice | null
  best_sell: ExchangePrice | null
  max_spread: number
  max_spread_percent: number
  buy_ranked: ExchangePrice[]
  sell_ranked: ExchangePrice[]
  all_exchanges: ExchangePrice[]
  updated_at: string
}

// Portfolio Types
export interface PortfolioHolding {
  id: string
  portfolio_id: string
  crypto: string
  amount: number
  buy_price_ngn: number
  notes?: string
  added_at: string
  current_price_ngn?: number
  current_value_ngn?: number
  cost_basis_ngn?: number
  pnl_ngn?: number
  pnl_percent?: number
}

export interface Portfolio {
  id: string
  user_id: string
  name: string
  created_at: string
  holdings: PortfolioHolding[]
}

export interface PortfolioSummary {
  portfolio: Portfolio
  total_value_ngn: number
  total_cost_ngn: number
  total_pnl_ngn: number
  total_pnl_percent: number
  allocation: { crypto: string; value: number; percent: number }[]
}

// DeFi Yield Types
export interface DefiPool {
  pool: string
  chain: string
  project: string
  symbol: string
  tvl_usd: number
  apy: number
  apy_base?: number
  apy_reward?: number
  il_risk?: string
  pool_url?: string
}

export interface DefiYieldsResponse {
  pools: DefiPool[]
  total: number
  chains: string[]
}

// News Types
export interface NewsItem {
  id: string
  title: string
  source: string
  url: string
  summary?: string
  image_url?: string
  category: string
  published_at?: string
  fetched_at: string
}

export interface NewsFeedResponse {
  items: NewsItem[]
  total: number
  sources: string[]
}

// Savings Calculator Types
export interface InvestmentRate {
  name: string
  category: string
  rates: Record<string, number>
  risk: string
}

export interface CalcResult {
  key: string
  name: string
  category: string
  risk: string
  annual_rate: number
  final_value: number
  total_return: number
  return_percent: number
  growth_curve: { month: number; value: number }[]
}

export interface CalcCompareResponse {
  amount_ngn: number
  duration: string
  months: number
  results: CalcResult[]
  winner: CalcResult | null
}

// DCA Types
export interface DcaEntry {
  id: string
  plan_id: string
  date: string
  amount_ngn: number
  price_per_unit_ngn: number
  crypto_amount: number
  exchange?: string
  notes?: string
  created_at: string
}

export interface DcaPlan {
  id: string
  user_id: string
  name: string
  crypto: string
  target_amount_ngn?: number
  frequency: string
  start_date?: string
  is_active: boolean
  created_at: string
  entries: DcaEntry[]
  total_invested_ngn?: number
  total_crypto?: number
  avg_cost_ngn?: number
  current_price_ngn?: number
  current_value_ngn?: number
  pnl_ngn?: number
  pnl_percent?: number
}

// Trading Signal Types
export interface TradingSignal {
  id: string
  asset_type: string
  asset_symbol: string
  direction: string
  entry_price: number
  target_price?: number
  stop_loss?: number
  reasoning?: string
  timeframe?: string
  status: string
  result?: string
  result_percent?: number
  is_premium: boolean
  created_at: string
  updated_at: string
}

export interface SignalStats {
  total_signals: number
  open_signals: number
  closed_signals: number
  win_rate: number
  avg_return: number
}

// Airdrop Types
export interface Airdrop {
  id: string
  name: string
  project: string
  description?: string
  category: string
  reward_estimate?: string
  reward_token?: string
  requirements?: string
  steps?: string
  url?: string
  image_url?: string
  status: string
  difficulty: string
  deadline?: string
  start_date?: string
  is_verified: boolean
  is_featured: boolean
  is_auto_curated?: boolean
  created_at: string
}
