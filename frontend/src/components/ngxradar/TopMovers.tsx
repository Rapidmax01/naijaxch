import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { getMarketSummary } from '../../services/ngx'
import type { Stock } from '../../types'

function StockRow({ stock, showVolume = false }: { stock: Stock; showVolume?: boolean }) {
  const isPositive = (stock.change_percent || 0) >= 0

  return (
    <Link
      to={`/ngx/stocks/${stock.symbol}`}
      className="flex items-center justify-between py-2 hover:bg-gray-50 px-2 rounded transition"
    >
      <div>
        <span className="font-medium text-gray-900">{stock.symbol}</span>
        <p className="text-xs text-gray-500 truncate max-w-[150px]">{stock.name}</p>
      </div>
      <div className="text-right">
        <p className="font-medium">₦{stock.current_price?.toFixed(2)}</p>
        {showVolume ? (
          <p className="text-xs text-gray-500">{stock.volume?.toLocaleString()}</p>
        ) : (
          <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{stock.change_percent?.toFixed(2)}%
          </p>
        )}
      </div>
    </Link>
  )
}

export function TopMovers() {
  const { data, isLoading } = useQuery({
    queryKey: ['ngx-market-summary'],
    queryFn: getMarketSummary,
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Top Gainers */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Top Gainers</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {data?.top_gainers.slice(0, 5).map(stock => (
            <StockRow key={stock.symbol} stock={stock} />
          ))}
        </div>
      </div>

      {/* Top Losers */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-900">Top Losers</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {data?.top_losers.slice(0, 5).map(stock => (
            <StockRow key={stock.symbol} stock={stock} />
          ))}
        </div>
      </div>

      {/* Most Active */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Most Active</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {data?.most_active.slice(0, 5).map(stock => (
            <StockRow key={stock.symbol} stock={stock} showVolume />
          ))}
        </div>
      </div>
    </div>
  )
}
