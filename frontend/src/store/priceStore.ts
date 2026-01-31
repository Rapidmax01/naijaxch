import { create } from 'zustand'
import type { ExchangePrice, ArbitrageOpportunity } from '../types'

interface PriceState {
  selectedCrypto: string
  exchanges: ExchangePrice[]
  opportunities: ArbitrageOpportunity[]
  lastUpdated: string | null
  isLoading: boolean
  setSelectedCrypto: (crypto: string) => void
  setExchanges: (exchanges: ExchangePrice[]) => void
  setOpportunities: (opportunities: ArbitrageOpportunity[]) => void
  setLastUpdated: (time: string) => void
  setLoading: (loading: boolean) => void
}

export const usePriceStore = create<PriceState>((set) => ({
  selectedCrypto: 'USDT',
  exchanges: [],
  opportunities: [],
  lastUpdated: null,
  isLoading: false,

  setSelectedCrypto: (crypto) => set({ selectedCrypto: crypto }),
  setExchanges: (exchanges) => set({ exchanges }),
  setOpportunities: (opportunities) => set({ opportunities }),
  setLastUpdated: (time) => set({ lastUpdated: time }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
