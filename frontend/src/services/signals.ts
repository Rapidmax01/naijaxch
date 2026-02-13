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

export async function createSignal(data: Partial<TradingSignal>): Promise<TradingSignal> {
  const response = await api.post<TradingSignal>('/signals', data)
  return response.data
}

export async function updateSignal(id: string, data: Partial<TradingSignal>): Promise<TradingSignal> {
  const response = await api.put<TradingSignal>(`/signals/${id}`, data)
  return response.data
}

export async function deleteSignal(id: string): Promise<void> {
  await api.delete(`/signals/${id}`)
}
