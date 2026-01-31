import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { screenStocks } from '../../services/ngx'
import type { Stock } from '../../types'

interface StockTableProps {
  sector?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
}

function formatNumber(num: number | undefined): string {
  if (!num) return '-'
  if (num >= 1e12) return '₦' + (num / 1e12).toFixed(2) + 'T'
  if (num >= 1e9) return '₦' + (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return '₦' + (num / 1e6).toFixed(2) + 'M'
  return '₦' + num.toLocaleString()
}

export function StockTable({ sector, sortBy = 'symbol', sortOrder = 'asc', limit = 20 }: StockTableProps) {
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState({ by: sortBy, order: sortOrder })

  const { data, isLoading, error } = useQuery({
    queryKey: ['ngx-screener', sector, sort.by, sort.order, page, limit],
    queryFn: () => screenStocks({
      sector,
      sort_by: sort.by,
      sort_order: sort.order,
      limit,
      offset: page * limit,
    }),
    refetchInterval: 60000,
  })

  const handleSort = (column: string) => {
    if (sort.by === column) {
      setSort({ by: column, order: sort.order === 'asc' ? 'desc' : 'asc' })
    } else {
      setSort({ by: column, order: 'desc' })
    }
    setPage(0)
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.by !== column) return null
    return sort.order === 'asc'
      ? <ArrowUp className="w-4 h-4 inline ml-1" />
      : <ArrowDown className="w-4 h-4 inline ml-1" />
  }

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-600">Failed to load stocks</p>
      </div>
    )
  }

  const stocks = data?.stocks || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('symbol')}
              >
                Symbol <SortIcon column="symbol" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sector</th>
              <th
                className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('current_price')}
              >
                Price <SortIcon column="current_price" />
              </th>
              <th
                className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('change_percent')}
              >
                Change <SortIcon column="change_percent" />
              </th>
              <th
                className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('volume')}
              >
                Volume <SortIcon column="volume" />
              </th>
              <th
                className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('market_cap')}
              >
                Market Cap <SortIcon column="market_cap" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-gray-600">
            Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn btn-secondary p-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn btn-secondary p-2 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
