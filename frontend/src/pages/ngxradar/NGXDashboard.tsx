import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bell, Star, Info } from 'lucide-react'
import { MarketSummary } from '../../components/ngxradar/MarketSummary'
import { TopMovers } from '../../components/ngxradar/TopMovers'
import { StockTable } from '../../components/ngxradar/StockTable'
import { ScreenerFilters, type FilterState } from '../../components/ngxradar/ScreenerFilters'

export default function NGXDashboard() {
  const [filters, setFilters] = useState<FilterState>({})

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">NGX Radar</h1>
          <p className="text-gray-600">
            Track Nigerian Stock Exchange listed companies
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/ngx/screener"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Screener
          </Link>
          <Link
            to="/ngx/watchlist"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Watchlist
          </Link>
          <Link
            to="/ngx/alerts"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Alerts
          </Link>
        </div>
      </div>

      {/* Market Summary */}
      <MarketSummary />

      {/* Top Movers */}
      <TopMovers />

      {/* Filters */}
      <ScreenerFilters onFilterChange={handleFilterChange} />

      {/* Stock Table */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Stocks</h2>
        <StockTable
          sector={filters.sector as string | undefined}
          sortBy="market_cap"
          sortOrder="desc"
        />
      </div>

      {/* Info Box */}
      <div className="card bg-green-50 border border-green-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">About NGX Radar</h3>
            <p className="text-green-800 text-sm mt-1">
              Track all stocks listed on the Nigerian Exchange (NGX). Use the
              screener to filter by sector, price, volume, and more. Set price
              alerts to get notified when stocks hit your target prices.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
