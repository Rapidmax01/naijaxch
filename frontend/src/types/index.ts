export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  telegram_chat_id?: number
  is_active: boolean
  is_verified: boolean
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
