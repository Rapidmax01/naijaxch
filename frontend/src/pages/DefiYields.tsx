import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, ChevronLeft, ChevronRight, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'
import { fetchDefiYields } from '../services/defi'
import type { DefiPool } from '../types'

const STABLECOIN_OPTIONS = ['All', 'USDT', 'USDC', 'DAI'] as const
const PAGE_SIZE = 20

function formatTvl(value: number): string {
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B'
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M'
  if (value >= 1e3) return '$' + (value / 1e3).toFixed(1) + 'K'
  return '$' + value.toFixed(0)
}

function apyColorClass(apy: number): string {
  if (apy > 10) return 'text-green-600 font-semibold'
  if (apy >= 5) return 'text-amber-600 font-medium'
  return 'text-gray-700'
}

export default function DefiYields() {
  const [chain, setChain] = useState<string>('')
  const [stablecoin, setStablecoin] = useState<string>('All')
  const [minTvl, setMinTvl] = useState<string>('')
  const [minApy, setMinApy] = useState<string>('')
  const [offset, setOffset] = useState(0)

  const symbolFilter = stablecoin === 'All' ? undefined : stablecoin

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['defi-yields', chain, symbolFilter, minTvl, minApy, offset],
    queryFn: () =>
      fetchDefiYields({
        chain: chain || undefined,
        symbol: symbolFilter,
        min_tvl: minTvl ? Number(minTvl) : undefined,
        min_apy: minApy ? Number(minApy) : undefined,
        limit: PAGE_SIZE,
        offset,
      }),
  })

  const pools: DefiPool[] = data?.pools || []
  const total = data?.total || 0
  const chains = data?.chains || []
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const handlePrevPage = () => {
    setOffset((prev) => Math.max(0, prev - PAGE_SIZE))
  }

  const handleNextPage = () => {
    if (offset + PAGE_SIZE < total) {
      setOffset((prev) => prev + PAGE_SIZE)
    }
  }

  const handleFilterChange = () => {
    setOffset(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">DeFi Yields</h1>
        <p className="text-gray-600">
          Discover the best DeFi yield opportunities across chains and stablecoins
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Chain Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Chain</label>
            <select
              value={chain}
              onChange={(e) => {
                setChain(e.target.value)
                handleFilterChange()
              }}
              className="input w-full"
            >
              <option value="">All Chains</option>
              {chains.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stablecoin Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Stablecoin</label>
            <div className="flex gap-1">
              {STABLECOIN_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setStablecoin(option)
                    handleFilterChange()
                  }}
                  className={`px-3 py-2 text-sm rounded-lg transition ${
                    stablecoin === option
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Min TVL */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Min TVL (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={minTvl}
                onChange={(e) => {
                  setMinTvl(e.target.value)
                  handleFilterChange()
                }}
                placeholder="e.g. 100000"
                className="input w-full pl-7"
              />
            </div>
          </div>

          {/* Min APY */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Min APY (%)</label>
            <div className="relative">
              <input
                type="number"
                value={minApy}
                onChange={(e) => {
                  setMinApy(e.target.value)
                  handleFilterChange()
                }}
                placeholder="e.g. 5"
                className="input w-full"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading yields...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-red-600 font-medium">Failed to load DeFi yields</p>
            <p className="text-gray-500 text-sm mt-1">
              {error instanceof Error ? error.message : 'Please try again later'}
            </p>
          </div>
        ) : pools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No pools found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="px-4 py-3 bg-gray-50 border-b text-sm text-gray-600">
              Showing{' '}
              <span className="font-medium">{offset + 1}</span>
              {' - '}
              <span className="font-medium">{Math.min(offset + PAGE_SIZE, total)}</span>
              {' of '}
              <span className="font-medium">{total.toLocaleString()}</span> pools
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Chain</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Symbol</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">TVL (USD)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">APY%</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Base APY</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Reward APY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pools.map((pool: DefiPool, index: number) => (
                    <tr
                      key={`${pool.pool}-${index}`}
                      onClick={() => {
                        if (pool.pool_url) {
                          window.open(pool.pool_url, '_blank', 'noopener,noreferrer')
                        }
                      }}
                      className={`hover:bg-gray-50 transition ${
                        pool.pool_url ? 'cursor-pointer' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{pool.project}</span>
                          {pool.pool_url && (
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 text-xs font-medium">
                          {pool.chain}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{pool.symbol}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                        {formatTvl(pool.tvl_usd)}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm ${apyColorClass(pool.apy)}`}>
                        {pool.apy.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {pool.apy_base !== undefined ? `${pool.apy_base.toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {pool.apy_reward !== undefined ? `${pool.apy_reward.toFixed(2)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <button
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                  className="btn btn-secondary flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={offset + PAGE_SIZE >= total}
                  className="btn btn-secondary flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
