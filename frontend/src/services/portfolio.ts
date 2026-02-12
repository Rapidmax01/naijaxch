import api from './api'
import type { PortfolioSummary } from '../types'

export async function fetchPortfolio(): Promise<PortfolioSummary> {
  const response = await api.get<PortfolioSummary>('/portfolio')
  return response.data
}

export async function createPortfolio(name: string = 'My Portfolio'): Promise<{ id: string; name: string }> {
  const response = await api.post('/portfolio', null, { params: { name } })
  return response.data
}

export async function addHolding(data: {
  crypto: string
  amount: number
  buy_price_ngn: number
  notes?: string
}): Promise<{ id: string }> {
  const response = await api.post('/portfolio/holdings', data)
  return response.data
}

export async function updateHolding(id: string, data: {
  amount?: number
  buy_price_ngn?: number
  notes?: string
}): Promise<{ id: string }> {
  const response = await api.put(`/portfolio/holdings/${id}`, data)
  return response.data
}

export async function deleteHolding(id: string): Promise<void> {
  await api.delete(`/portfolio/holdings/${id}`)
}
