import { useQuery } from '@tanstack/react-query'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { fetchPrices } from '../../services/arbscanner'
import { formatNaira, formatRelativeTime } from '../../utils/formatters'
import type { ExchangePrice } from '../../types'

interface Props {
  crypto: string
}

export function PriceGrid({ crypto }: Props) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['prices', crypto],
    queryFn: () => fetchPrices(crypto),
    refetchInterval: 60000, // Refresh every minute
  })

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const exchanges = data?.exchanges || []
  const bestBuy = data?.best_buy
  const bestSell = data?.best_sell

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">{crypto}/NGN Prices</h2>
          <p className="text-sm text-gray-500">
            {data?.updated_at && formatRelativeTime(data.updated_at)}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Best prices highlight */}
      {bestBuy && bestSell && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
              <TrendingDown className="w-4 h-4" />
              Best Buy
            </div>
            <div className="font-bold text-lg">{formatNaira(bestBuy.buy_price)}</div>
            <div className="text-sm text-gray-600">{bestBuy.display_name}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Best Sell
            </div>
            <div className="font-bold text-lg">{formatNaira(bestSell.sell_price)}</div>
            <div className="text-sm text-gray-600">{bestSell.display_name}</div>
          </div>
        </div>
      )}

      {/* Price table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b">
              <th className="pb-3 font-medium">Exchange</th>
              <th className="pb-3 text-right font-medium">Buy Price</th>
              <th className="pb-3 text-right font-medium">Sell Price</th>
              <th className="pb-3 text-right font-medium">Spread</th>
            </tr>
          </thead>
          <tbody>
            {exchanges.map((exchange: ExchangePrice) => (
              <tr key={exchange.exchange} className="border-b last:border-0">
                <td className="py-3">
                  <div className="font-medium">{exchange.display_name}</div>
                  <div className="text-xs text-gray-500 capitalize">{exchange.exchange.replace('_', ' ')}</div>
                </td>
                <td className="py-3 text-right">
                  <span className={`font-medium ${
                    bestBuy?.exchange === exchange.exchange ? 'text-green-600' : ''
                  }`}>
                    {formatNaira(exchange.buy_price)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className={`font-medium ${
                    bestSell?.exchange === exchange.exchange ? 'text-red-600' : ''
                  }`}>
                    {formatNaira(exchange.sell_price)}
                  </span>
                </td>
                <td className="py-3 text-right text-gray-600">
                  {exchange.spread_percent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {exchanges.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No price data available. Please try refreshing.
        </div>
      )}
    </div>
  )
}
