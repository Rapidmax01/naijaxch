import api from './api'
import type { DefiYieldsResponse } from '../types'

export async function fetchDefiYields(params?: {
  chain?: string
  symbol?: string
  min_tvl?: number
  min_apy?: number
  limit?: number
  offset?: number
}): Promise<DefiYieldsResponse> {
  const response = await api.get<DefiYieldsResponse>('/defi/yields', { params })
  return response.data
}

export async function fetchDefiChains(): Promise<{ chains: string[] }> {
  const response = await api.get('/defi/chains')
  return response.data
}
