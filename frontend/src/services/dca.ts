import api from './api'
import type { DcaPlan } from '../types'

export async function fetchDcaPlans(): Promise<{ plans: DcaPlan[] }> {
  const response = await api.get('/dca/plans')
  return response.data
}

export async function fetchDcaPlan(planId: string): Promise<DcaPlan> {
  const response = await api.get<DcaPlan>(`/dca/plans/${planId}`)
  return response.data
}

export async function createDcaPlan(data: {
  name: string
  crypto: string
  target_amount_ngn?: number
  frequency?: string
  start_date?: string
}): Promise<{ id: string }> {
  const response = await api.post('/dca/plans', data)
  return response.data
}

export async function updateDcaPlan(planId: string, data: {
  name?: string
  target_amount_ngn?: number
  frequency?: string
  is_active?: boolean
}): Promise<{ id: string }> {
  const response = await api.put(`/dca/plans/${planId}`, data)
  return response.data
}

export async function deleteDcaPlan(planId: string): Promise<void> {
  await api.delete(`/dca/plans/${planId}`)
}

export async function addDcaEntry(planId: string, data: {
  date: string
  amount_ngn: number
  price_per_unit_ngn: number
  crypto_amount: number
  exchange?: string
  notes?: string
}): Promise<{ id: string }> {
  const response = await api.post(`/dca/plans/${planId}/entries`, data)
  return response.data
}

export async function deleteDcaEntry(entryId: string): Promise<void> {
  await api.delete(`/dca/entries/${entryId}`)
}
