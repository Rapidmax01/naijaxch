import api from './api'
import type { CalcCompareResponse, InvestmentRate } from '../types'

export async function fetchInvestmentRates(): Promise<{
  rates: Record<string, InvestmentRate>
  durations: string[]
}> {
  const response = await api.get('/calculator/rates')
  return response.data
}

export async function compareInvestments(
  amount_ngn: number,
  duration: string = '1yr'
): Promise<CalcCompareResponse> {
  const response = await api.post<CalcCompareResponse>('/calculator/compare', {
    amount_ngn,
    duration,
  })
  return response.data
}
