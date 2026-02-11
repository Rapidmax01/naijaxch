import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, ArrowDownCircle, ArrowUpCircle, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react'
import { fetchPrices } from '../../services/arbscanner'
import { formatNaira, formatRelativeTime } from '../../utils/formatters'
import type { ExchangePrice } from '../../types'

interface Props {
  crypto: string
}

function StatusDot({ source }: { source?: string }) {
  const color =
    source === 'live'
      ? 'bg-green-500'
      : source === 'cached'
        ? 'bg-yellow-500'
        : 'bg-gray-400'
  const label =
    source === 'live'
      ? 'Live'
      : source === 'cached'
        ? 'Cached'
        : 'Sample'

  return (
    <span className="inline-flex items-center gap-1" title={label}>
      <span className={`w-2 h-2 rounded-full ${color} ${source === 'live' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </span>
  )
}

type SortKey = 'exchange' | 'buy_price' | 'sell_price' | 'spread_percent'
type SortDir = 'asc' | 'desc'

function getRowStyle(source?: string): string {
  if (source === 'sample') return 'opacity-60 bg-gray-50'
  if (source === 'cached') return 'bg-yellow-50/50'
  return ''
}

export function PriceGrid({ crypto }: Props) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['prices', crypto],
    queryFn: () => fetchPrices(crypto),
    refetchInterval: 60000,
  })

  const [sortKey, setSortKey] = useState<SortKey>('exchange')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const exchanges = data?.exchanges || []
  const bestBuy = data?.best_buy
  const bestSell = data?.best_sell
  const statuses = data?.exchange_statuses

  const sortedExchanges = useMemo(() => {
    const sorted = [...exchanges].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'exchange') {
        cmp = a.display_name.localeCompare(b.display_name)
      } else {
        cmp = (a[sortKey] ?? 0) - (b[sortKey] ?? 0)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [exchanges, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'exchange' ? 'asc' : 'desc')
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5" />
  }

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

  const offlineCount = statuses
    ? Object.values(statuses).filter((s) => s !== 'live').length
    : 0

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

      {offlineCount > 0 && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-4 text-sm text-yellow-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            {offlineCount} exchange{offlineCount > 1 ? 's' : ''} showing{' '}
            {offlineCount > 1 ? 'cached/sample' : 'cached or sample'} data.
            Prices may not be current.
          </span>
        </div>
      )}

      {/* Best prices highlight */}
      {bestBuy && bestSell && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
              <ArrowDownCircle className="w-4 h-4" />
              Best Buy
            </div>
            <div className="font-bold text-lg">{formatNaira(bestBuy.buy_price)}</div>
            <div className="text-sm text-gray-600">{bestBuy.display_name}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
              <ArrowUpCircle className="w-4 h-4" />
              Best Sell
            </div>
            <div className="font-bold text-lg">{formatNaira(bestSell.sell_price)}</div>
            <div className="text-sm text-gray-600">{bestSell.display_name}</div>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b">
              <th className="pb-3 font-medium cursor-pointer select-none" onClick={() => handleSort('exchange')}>
                Exchange <SortIcon column="exchange" />
              </th>
              <th className="pb-3 text-right font-medium cursor-pointer select-none" onClick={() => handleSort('buy_price')}>
                Buy Price <SortIcon column="buy_price" />
              </th>
              <th className="pb-3 text-right font-medium cursor-pointer select-none" onClick={() => handleSort('sell_price')}>
                Sell Price <SortIcon column="sell_price" />
              </th>
              <th className="pb-3 text-right font-medium cursor-pointer select-none" onClick={() => handleSort('spread_percent')}>
                Spread <SortIcon column="spread_percent" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedExchanges.map((exchange: ExchangePrice) => (
              <tr key={exchange.exchange} className={`border-b last:border-0 ${getRowStyle(exchange.data_source)}`}>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{exchange.display_name}</span>
                    <StatusDot source={exchange.data_source} />
                  </div>
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
                    bestSell?.exchange === exchange.exchange ? 'text-blue-600' : ''
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

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {sortedExchanges.map((exchange: ExchangePrice) => (
          <div key={exchange.exchange} className={`rounded-lg border p-4 ${getRowStyle(exchange.data_source)}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">{exchange.display_name}</span>
              <StatusDot source={exchange.data_source} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Buy</span>
                <p className={`font-medium ${bestBuy?.exchange === exchange.exchange ? 'text-green-600' : ''}`}>
                  {formatNaira(exchange.buy_price)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-gray-500">Sell</span>
                <p className={`font-medium ${bestSell?.exchange === exchange.exchange ? 'text-blue-600' : ''}`}>
                  {formatNaira(exchange.sell_price)}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-right">
              Spread: {exchange.spread_percent.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      {exchanges.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-3">No price data available.</p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {isFetching ? 'Refreshing...' : 'Retry'}
          </button>
        </div>
      )}
    </div>
  )
}
