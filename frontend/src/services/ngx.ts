import api from './api'
import type {
  MarketSummary,
  Stock,
  StockDetail,
  ScreenerResponse,
  Watchlist,
  StockAlert,
  Dividend
} from '../types'

// Market Summary
export async function getMarketSummary(): Promise<MarketSummary> {
  const response = await api.get('/ngx/summary')
  return response.data
}

// Stocks
export async function getStocks(params?: {
  sector?: string
  limit?: number
  offset?: number
}): Promise<Stock[]> {
  const response = await api.get('/ngx/stocks', { params })
  return response.data
}

export async function getStock(symbol: string): Promise<StockDetail> {
  const response = await api.get(`/ngx/stocks/${symbol}`)
  return response.data
}

export async function getSectors(): Promise<string[]> {
  const response = await api.get('/ngx/sectors')
  return response.data
}

export async function getTopGainers(limit = 10): Promise<Stock[]> {
  const response = await api.get('/ngx/gainers', { params: { limit } })
  return response.data
}

export async function getTopLosers(limit = 10): Promise<Stock[]> {
  const response = await api.get('/ngx/losers', { params: { limit } })
  return response.data
}

export async function getMostActive(limit = 10): Promise<Stock[]> {
  const response = await api.get('/ngx/active', { params: { limit } })
  return response.data
}

// Screener
export async function screenStocks(params: {
  sector?: string
  min_price?: number
  max_price?: number
  min_change_percent?: number
  max_change_percent?: number
  min_volume?: number
  min_market_cap?: number
  max_pe_ratio?: number
  min_dividend_yield?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}): Promise<ScreenerResponse> {
  const response = await api.get('/ngx/screener', { params })
  return response.data
}

// Watchlist
export async function getWatchlists(): Promise<Watchlist[]> {
  const response = await api.get('/ngx/watchlists')
  return response.data
}

export async function createWatchlist(name: string): Promise<Watchlist> {
  const response = await api.post('/ngx/watchlists', { name })
  return response.data
}

export async function deleteWatchlist(id: string): Promise<void> {
  await api.delete(`/ngx/watchlists/${id}`)
}

export async function addToWatchlist(watchlistId: string, symbol: string): Promise<void> {
  await api.post(`/ngx/watchlists/${watchlistId}/stocks`, { symbol })
}

export async function removeFromWatchlist(watchlistId: string, symbol: string): Promise<void> {
  await api.delete(`/ngx/watchlists/${watchlistId}/stocks/${symbol}`)
}

// Alerts
export async function getStockAlerts(activeOnly = true): Promise<StockAlert[]> {
  const response = await api.get('/ngx/alerts', { params: { active_only: activeOnly } })
  return response.data
}

export async function createStockAlert(data: {
  symbol: string
  alert_type: string
  target_value: number
  notify_telegram?: boolean
  notify_email?: boolean
}): Promise<StockAlert> {
  const response = await api.post('/ngx/alerts', data)
  return response.data
}

export async function deleteStockAlert(id: string): Promise<void> {
  await api.delete(`/ngx/alerts/${id}`)
}

export async function toggleStockAlert(id: string): Promise<StockAlert> {
  const response = await api.post(`/ngx/alerts/${id}/toggle`)
  return response.data
}

// Dividends
export async function getDividends(params?: {
  symbol?: string
  upcoming?: boolean
  limit?: number
}): Promise<Dividend[]> {
  const response = await api.get('/ngx/dividends', { params })
  return response.data
}

export async function getDividendCalendar(): Promise<{
  upcoming: Dividend[]
  recent: Dividend[]
}> {
  const response = await api.get('/ngx/dividends/calendar')
  return response.data
}
