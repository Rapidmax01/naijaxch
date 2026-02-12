import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, TrendingDown, TrendingUp, ArrowUpDown, ExternalLink } from 'lucide-react'
import { fetchP2PComparison } from '../services/p2p'
import { formatNaira, formatPercent, formatRelativeTime } from '../utils/formatters'
import { getExchangeDisplayName, getExchangeReferralUrl } from '../utils/exchanges'
import type { P2PComparison, ExchangePrice } from '../types'

const CRYPTO_TABS = ['USDT', 'BTC', 'ETH'] as const

function ExchangeLink({ exchange }: { exchange: string }) {
  const name = getExchangeDisplayName(exchange)
  const url = getExchangeReferralUrl(exchange)

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
      >
        {name}
        <ExternalLink className="w-3 h-3" />
      </a>
    )
  }

  return <span className="font-medium text-gray-900">{name}</span>
}

function PriceTable({
  title,
  icon,
  prices,
  priceKey,
  colorClass,
}: {
  title: string
  icon: React.ReactNode
  prices: ExchangePrice[]
  priceKey: 'buy_price' | 'sell_price'
  colorClass: string
}) {
  if (prices.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 text-gray-500 font-medium">#</th>
              <th className="text-left py-2 pr-4 text-gray-500 font-medium">Exchange</th>
              <th className="text-right py-2 text-gray-500 font-medium">Price (NGN)</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((ep, index) => (
              <tr
                key={ep.exchange}
                className={`border-b border-gray-100 last:border-0 ${
                  index === 0 ? `${colorClass} bg-opacity-10` : ''
                }`}
              >
                <td className="py-3 pr-4 text-gray-400 font-mono">{index + 1}</td>
                <td className="py-3 pr-4">
                  <ExchangeLink exchange={ep.exchange} />
                  {ep.data_source === 'sample' && (
                    <span className="ml-2 text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                      sample
                    </span>
                  )}
                </td>
                <td className={`py-3 text-right font-semibold ${index === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                  {formatNaira(ep[priceKey])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function P2PComparator() {
  const [selectedCrypto, setSelectedCrypto] = useState<string>('USDT')

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<P2PComparison>({
    queryKey: ['p2p-comparison', selectedCrypto],
    queryFn: () => fetchP2PComparison(selectedCrypto),
    refetchInterval: 60000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">P2P Price Comparator</h1>
          <p className="text-gray-600">
            Compare buy and sell prices across Nigerian P2P exchanges
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

      {/* Crypto Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {CRYPTO_TABS.map((crypto) => (
          <button
            key={crypto}
            onClick={() => setSelectedCrypto(crypto)}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedCrypto === crypto
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {crypto}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading P2P prices...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card bg-red-50 border border-red-200">
          <p className="text-red-700 font-medium">Failed to load P2P data</p>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm text-red-700 underline hover:text-red-900"
          >
            Try again
          </button>
        </div>
      )}

      {/* Data */}
      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Cheapest Buy */}
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-medium text-gray-500 uppercase">Cheapest Buy</h3>
              </div>
              {data.cheapest_buy ? (
                <>
                  <p className="text-2xl font-bold text-green-700">
                    {formatNaira(data.cheapest_buy.buy_price)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <ExchangeLink exchange={data.cheapest_buy.exchange} />
                  </p>
                </>
              ) : (
                <p className="text-gray-400">No data</p>
              )}
            </div>

            {/* Best Sell */}
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-500 uppercase">Best Sell</h3>
              </div>
              {data.best_sell ? (
                <>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatNaira(data.best_sell.sell_price)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <ExchangeLink exchange={data.best_sell.exchange} />
                  </p>
                </>
              ) : (
                <p className="text-gray-400">No data</p>
              )}
            </div>

            {/* Max Spread */}
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpDown className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-medium text-gray-500 uppercase">Max Spread</h3>
              </div>
              <p className="text-2xl font-bold text-orange-700">
                {formatPercent(data.max_spread_percent)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatNaira(data.max_spread)} potential profit
              </p>
            </div>
          </div>

          {/* Buy & Sell Ranked Tables */}
          <div className="grid lg:grid-cols-2 gap-6">
            <PriceTable
              title="Buy Prices (Lowest First)"
              icon={<TrendingDown className="w-5 h-5 text-green-600" />}
              prices={data.buy_ranked}
              priceKey="buy_price"
              colorClass="bg-green-50"
            />
            <PriceTable
              title="Sell Prices (Highest First)"
              icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
              prices={data.sell_ranked}
              priceKey="sell_price"
              colorClass="bg-blue-50"
            />
          </div>

          {/* Last Updated */}
          <p className="text-xs text-gray-400 text-center">
            Last updated: {formatRelativeTime(data.updated_at)} — auto-refreshes every 60 seconds
          </p>
        </>
      )}
    </div>
  )
}
