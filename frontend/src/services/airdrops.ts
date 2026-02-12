import api from './api'
import type { Airdrop } from '../types'

export async function fetchAirdrops(params?: {
  status?: string
  category?: string
  difficulty?: string
  limit?: number
  offset?: number
}): Promise<{ airdrops: Airdrop[]; total: number }> {
  const response = await api.get('/airdrops', { params })
  return response.data
}

export async function fetchAirdrop(id: string): Promise<Airdrop> {
  const response = await api.get<Airdrop>(`/airdrops/${id}`)
  return response.data
}
