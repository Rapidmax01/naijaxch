import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ScreenerFilters, type FilterState } from '../../components/ngxradar/ScreenerFilters'
import { screenStocks } from '../../services/ngx'
import type { Stock } from '../../types'

function formatNumber(num: number | undefined): string {
  if (!num) return '-'
  if (num >= 1e12) return '₦' + (num / 1e12).toFixed(2) + 'T'
  if (num >= 1e9) return '₦' + (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return '₦' + (num / 1e6).toFixed(2) + 'M'
  return '₦' + num.toLocaleString()
}

export default function Screener() {
  const [filters, setFilters] = useState<FilterState>({})
  const [sortBy, setSortBy] = useState('market_cap')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['ngx-screener-full', filters, sortBy, sortOrder],
    queryFn: () => screenStocks({
      ...filters,
      sort_by: sortBy,
      sort_order: sortOrder,
      limit: 100,
    } as Parameters<typeof screenStocks>[0]),
  })

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const stocks = data?.stocks || []
  const total = data?.total || 0

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
          <h1 className="text-3xl font-bold text-gray-900">Stock Screener</h1>
          <p className="text-gray-600">
            Filter and sort stocks based on various criteria
          </p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <ScreenerFilters onFilterChange={handleFilterChange} />

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-medium">{stocks.length}</span> of{' '}
          <span className="font-medium">{total}</span> stocks
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input py-1 text-sm"
          >
            <option value="symbol">Symbol</option>
            <option value="current_price">Price</option>
            <option value="change_percent">Change %</option>
            <option value="volume">Volume</option>
            <option value="market_cap">Market Cap</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary py-1 px-2 text-sm"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sector</th>
                  <th
                    className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('current_price')}
                  >
                    Price {sortBy === 'current_price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('change_percent')}
                  >
                    Change {sortBy === 'change_percent' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('volume')}
                  >
                    Volume {sortBy === 'volume' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('market_cap')}
                  >
                    Market Cap {sortBy === 'market_cap' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stocks.map((stock: Stock) => {
                  const isPositive = (stock.change_percent || 0) >= 0
                  return (
                    <tr key={stock.symbol} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/ngx/stocks/${stock.symbol}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {stock.symbol}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{stock.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 text-xs">
                          {stock.sector || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₦{stock.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.change_percent !== undefined ? (
                          <>
                            {isPositive ? '+' : ''}{stock.change_percent.toFixed(2)}%
                          </>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {stock.volume?.toLocaleString() || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {formatNumber(stock.market_cap)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
