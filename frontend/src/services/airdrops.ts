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

export async function createAirdrop(data: Partial<Airdrop>): Promise<Airdrop> {
  const response = await api.post<Airdrop>('/airdrops', data)
  return response.data
}

export async function updateAirdrop(id: string, data: Partial<Airdrop>): Promise<Airdrop> {
  const response = await api.put<Airdrop>(`/airdrops/${id}`, data)
  return response.data
}

export async function deleteAirdrop(id: string): Promise<void> {
  await api.delete(`/airdrops/${id}`)
}
