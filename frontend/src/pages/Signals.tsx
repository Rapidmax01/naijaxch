import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Radio,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { fetchSignals, fetchSignalStats } from '../services/signals'
import { SignalCard } from '../components/signals/SignalCard'
import type { TradingSignal, SignalStats } from '../types'

const PAGE_SIZE = 12

export default function Signals() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all')
  const [offset, setOffset] = useState(0)

  // ---------- queries ----------
  const {
    data: statsData,
    isLoading: statsLoading,
  } = useQuery<SignalStats>({
    queryKey: ['signal-stats'],
    queryFn: fetchSignalStats,
    refetchInterval: 60_000,
  })

  const {
    data: signalsData,
    isLoading: signalsLoading,
  } = useQuery<{ signals: TradingSignal[]; total: number }>({
    queryKey: ['signals', statusFilter, assetTypeFilter, offset],
    queryFn: () =>
      fetchSignals({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        asset_type: assetTypeFilter !== 'all' ? assetTypeFilter : undefined,
        limit: PAGE_SIZE,
        offset,
      }),
    refetchInterval: 30_000,
  })

  const signals = signalsData?.signals ?? []
  const total = signalsData?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  // ---------- pagination helpers ----------
  const goNext = () => {
    if (offset + PAGE_SIZE < total) setOffset(offset + PAGE_SIZE)
  }
  const goPrev = () => {
    if (offset - PAGE_SIZE >= 0) setOffset(offset - PAGE_SIZE)
  }

  // Reset offset when filters change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setOffset(0)
  }
  const handleAssetTypeChange = (value: string) => {
    setAssetTypeFilter(value)
    setOffset(0)
  }

  // ---------- render ----------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trading Signals</h1>
        <p className="text-gray-600">
          Curated trade ideas with entry, target, and stop-loss levels
        </p>
      </div>

      {/* Stats Bar */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-7 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : statsData ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Win Rate</p>
              <p className="text-xl font-bold text-gray-900">{statsData.win_rate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Signals</p>
              <p className="text-xl font-bold text-gray-900">{statsData.total_signals}</p>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Radio className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Open</p>
              <p className="text-xl font-bold text-gray-900">{statsData.open_signals}</p>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Closed</p>
              <p className="text-xl font-bold text-gray-900">{statsData.closed_signals}</p>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Avg Return</p>
              <p className="text-xl font-bold text-gray-900">
                {statsData.avg_return >= 0 ? '+' : ''}{statsData.avg_return.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filter Bar */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="input py-1.5 text-sm"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="asset-filter" className="text-sm font-medium text-gray-700">
              Asset Type:
            </label>
            <select
              id="asset-filter"
              value={assetTypeFilter}
              onChange={(e) => handleAssetTypeChange(e.target.value)}
              className="input py-1.5 text-sm"
            >
              <option value="all">All</option>
              <option value="crypto">Crypto</option>
              <option value="stock">Stock</option>
            </select>
          </div>

          <div className="sm:ml-auto text-sm text-gray-500">
            Showing {signals.length} of {total} signals
          </div>
        </div>
      </div>

      {/* Signals Grid */}
      {signalsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-20 bg-gray-100 rounded mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div className="card text-center py-12">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No signals found</h3>
          <p className="text-gray-500 text-sm">
            Try adjusting your filters or check back later for new signals.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={goPrev}
            disabled={offset === 0}
            className="btn btn-secondary flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={offset + PAGE_SIZE >= total}
            className="btn btn-secondary flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
