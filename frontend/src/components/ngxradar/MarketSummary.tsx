import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, BarChart2, DollarSign } from 'lucide-react'
import { getMarketSummary } from '../../services/ngx'

function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  return num.toLocaleString()
}

export function MarketSummary() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ngx-market-summary'],
    queryFn: getMarketSummary,
    refetchInterval: 60000, // Refresh every minute
  })

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-600">Failed to load market summary</p>
      </div>
    )
  }

  const isPositive = data.asi_change >= 0

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">NGX Market Summary</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* ASI */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <BarChart2 className="w-4 h-4" />
            All Share Index
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.asi.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}{data.asi_change.toFixed(2)} ({isPositive ? '+' : ''}{data.asi_change_percent.toFixed(2)}%)
          </p>
        </div>

        {/* Market Cap */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Market Cap
          </div>
          <p className="text-2xl font-bold text-gray-900">₦{formatNumber(data.market_cap)}</p>
        </div>

        {/* Volume */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-gray-500 text-sm mb-1">Volume</div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.volume)}</p>
        </div>

        {/* Value */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-gray-500 text-sm mb-1">Value</div>
          <p className="text-2xl font-bold text-gray-900">₦{formatNumber(data.value)}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Last updated: {new Date(data.date).toLocaleDateString()}
      </p>
    </div>
  )
}
