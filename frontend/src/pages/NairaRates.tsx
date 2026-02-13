import { useQuery } from '@tanstack/react-query'
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import api from '../services/api'
import { AdBanner } from '../components/common/AdBanner'

interface CurrencyRate {
  code: string
  name: string
  flag: string
  official: number
  parallel: number
  buy: number
  sell: number
  spread: number
  spread_percent: number
}

interface RatesData {
  currencies: Record<string, CurrencyRate>
  source: string
  updated_at: string
}

function formatNGN(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function NairaRates() {
  const { data, isLoading, refetch, isFetching } = useQuery<RatesData>({
    queryKey: ['naira-rates'],
    queryFn: async () => {
      const res = await api.get('/naira/rates')
      return res.data
    },
    refetchInterval: 300000, // 5 minutes
  })

  const currencies = data?.currencies ? Object.values(data.currencies) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Naira Rate Tracker</h1>
          <p className="text-gray-600">
            Live NGN exchange rates — official and parallel market
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn btn-secondary flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-10 bg-gray-100 rounded mb-2"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Rate Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {currencies.map((currency) => (
              <div key={currency.code} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{currency.flag}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{currency.code}/NGN</h3>
                      <p className="text-sm text-gray-500">{currency.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {currency.spread_percent > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                    <span className={currency.spread_percent > 5 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {currency.spread_percent.toFixed(1)}% gap
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Official Rate */}
                  <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-xs text-blue-600 font-medium uppercase">Official Rate</p>
                      <p className="text-sm text-gray-500">CBN / Banks</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">{formatNGN(currency.official)}</p>
                  </div>

                  {/* Parallel Rate - Buy/Sell */}
                  <div className="bg-green-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-green-600 font-medium uppercase mb-2">Parallel / Black Market</p>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Buy</p>
                        <p className="text-lg font-bold text-green-700">{formatNGN(currency.buy || currency.parallel)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Sell</p>
                        <p className="text-lg font-bold text-green-700">{formatNGN(currency.sell || currency.parallel)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Spread */}
                  <div className="flex items-center justify-between px-4 py-2 border-t">
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <ArrowUpDown className="w-3 h-3" />
                      Spread
                    </div>
                    <p className="font-semibold text-gray-700">{formatNGN(currency.spread)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info box */}
          <div className="card bg-yellow-50 border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-1">About These Rates</h3>
            <p className="text-yellow-800 text-sm">
              <strong>Official rates</strong> are sourced from the CBN and interbank market.{' '}
              <strong>Parallel rates</strong> reflect real black market buy/sell prices from
              currency dealers across Lagos, Abuja, and other major cities.
              Rates update every 5 minutes.
            </p>
          </div>
        </>
      )}

      {/* Dashboard ad */}
      <AdBanner adSlot="NAIRA_RATES_SLOT" adFormat="horizontal" />
    </div>
  )
}
