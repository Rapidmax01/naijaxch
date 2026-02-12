import api from './api'
import type { P2PComparison } from '../types'

export async function fetchP2PComparison(crypto: string = 'USDT'): Promise<P2PComparison> {
  const response = await api.get<P2PComparison>('/p2p/compare', { params: { crypto } })
  return response.data
}

export async function fetchAllP2PComparisons(): Promise<{
  comparisons: Record<string, { cheapest_buy: any; best_sell: any; max_spread: number; max_spread_percent: number; exchange_count: number }>
  cryptos: string[]
}> {
  const response = await api.get('/p2p/compare/all')
  return response.data
}
