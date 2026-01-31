import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, TrendingUp, TrendingDown, Bell, Star, Building } from 'lucide-react'
import { getStock } from '../../services/ngx'

function formatNumber(num: number | undefined): string {
  if (!num) return '-'
  if (num >= 1e12) return '₦' + (num / 1e12).toFixed(2) + 'T'
  if (num >= 1e9) return '₦' + (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return '₦' + (num / 1e6).toFixed(2) + 'M'
  return '₦' + num.toLocaleString()
}

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>()

  const { data: stock, isLoading, error } = useQuery({
    queryKey: ['ngx-stock', symbol],
    queryFn: () => getStock(symbol!),
    enabled: !!symbol,
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error || !stock) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-600">Stock not found</p>
        <Link to="/ngx" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to NGX Radar
        </Link>
      </div>
    )
  }

  const isPositive = (stock.change_percent || 0) >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/ngx"
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to NGX Radar
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{stock.symbol}</h1>
            {stock.sector && (
              <span className="px-2 py-1 bg-gray-100 rounded text-gray-600 text-sm flex items-center gap-1">
                <Building className="w-3 h-3" />
                {stock.sector}
              </span>
            )}
          </div>
          <p className="text-gray-600">{stock.name}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary flex items-center gap-2">
            <Star className="w-4 h-4" />
            Add to Watchlist
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Set Alert
          </button>
        </div>
      </div>

      {/* Price Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div>
            <p className="text-gray-500 text-sm mb-1">Current Price</p>
            <p className="text-4xl font-bold text-gray-900">
              ₦{stock.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`flex items-center gap-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span className="text-xl font-medium">
              {isPositive ? '+' : ''}{stock.change?.toFixed(2)} ({isPositive ? '+' : ''}{stock.change_percent?.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-gray-500 text-sm mb-1">Market Cap</p>
          <p className="text-xl font-bold text-gray-900">{formatNumber(stock.market_cap)}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm mb-1">Volume</p>
          <p className="text-xl font-bold text-gray-900">{stock.volume?.toLocaleString() || '-'}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm mb-1">P/E Ratio</p>
          <p className="text-xl font-bold text-gray-900">{stock.pe_ratio?.toFixed(2) || '-'}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm mb-1">Dividend Yield</p>
          <p className="text-xl font-bold text-gray-900">
            {stock.dividend_yield ? `${stock.dividend_yield.toFixed(2)}%` : '-'}
          </p>
        </div>
      </div>

      {/* 52 Week Range */}
      {(stock.low_52w || stock.high_52w) && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">52 Week Range</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              ₦{stock.low_52w?.toLocaleString()}
            </span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full relative">
              {stock.current_price && stock.low_52w && stock.high_52w && (
                <div
                  className="absolute top-1/2 w-3 h-3 bg-primary-600 rounded-full -translate-y-1/2"
                  style={{
                    left: `${((stock.current_price - stock.low_52w) / (stock.high_52w - stock.low_52w)) * 100}%`
                  }}
                />
              )}
            </div>
            <span className="text-sm text-gray-600">
              ₦{stock.high_52w?.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Price History */}
      {stock.prices && stock.prices.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Price History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Open</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">High</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Low</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Close</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stock.prices.slice(0, 10).map((price) => (
                  <tr key={price.date}>
                    <td className="px-4 py-2 text-sm">{new Date(price.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right text-sm">₦{price.open_price?.toFixed(2) || '-'}</td>
                    <td className="px-4 py-2 text-right text-sm">₦{price.high_price?.toFixed(2) || '-'}</td>
                    <td className="px-4 py-2 text-right text-sm">₦{price.low_price?.toFixed(2) || '-'}</td>
                    <td className="px-4 py-2 text-right text-sm font-medium">₦{price.close_price.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-sm">{price.volume?.toLocaleString() || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
