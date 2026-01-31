import api from './api'
import type {
  AllPricesResponse,
  OpportunitiesResponse,
  CalculateRequest,
  CalculateResponse,
  Alert,
} from '../types'

export async function fetchPrices(
  crypto: string = 'USDT',
  refresh: boolean = false
): Promise<AllPricesResponse> {
  const response = await api.get<AllPricesResponse>('/arb/prices', {
    params: { crypto, refresh },
  })
  return response.data
}

export async function fetchOpportunities(
  crypto: string = 'USDT',
  minSpread: number = 0.5,
  tradeAmount: number = 100000
): Promise<OpportunitiesResponse> {
  const response = await api.get<OpportunitiesResponse>('/arb/opportunities', {
    params: {
      crypto,
      min_spread: minSpread,
      trade_amount: tradeAmount,
    },
  })
  return response.data
}

export async function calculateArbitrage(
  request: CalculateRequest
): Promise<CalculateResponse> {
  const response = await api.post<CalculateResponse>('/arb/calculate', request)
  return response.data
}

export async function fetchExchanges(): Promise<{
  exchanges: { name: string; display_name: string; type: string }[]
  cryptos: string[]
}> {
  const response = await api.get('/arb/exchanges')
  return response.data
}

export async function fetchFees(): Promise<{ fees: Record<string, unknown> }> {
  const response = await api.get('/arb/fees')
  return response.data
}

// Alerts
export async function fetchAlerts(): Promise<Alert[]> {
  const response = await api.get<Alert[]>('/arb/alerts')
  return response.data
}

export async function createAlert(data: Partial<Alert>): Promise<Alert> {
  const response = await api.post<Alert>('/arb/alerts', data)
  return response.data
}

export async function updateAlert(id: string, data: Partial<Alert>): Promise<Alert> {
  const response = await api.put<Alert>(`/arb/alerts/${id}`, data)
  return response.data
}

export async function deleteAlert(id: string): Promise<void> {
  await api.delete(`/arb/alerts/${id}`)
}
