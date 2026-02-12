import api from './api'
import type { TradingSignal, SignalStats } from '../types'

export async function fetchSignals(params?: {
  status?: string
  asset_type?: string
  limit?: number
  offset?: number
}): Promise<{ signals: TradingSignal[]; total: number }> {
  const response = await api.get('/signals', { params })
  return response.data
}

export async function fetchSignalStats(): Promise<SignalStats> {
  const response = await api.get<SignalStats>('/signals/stats')
  return response.data
}
