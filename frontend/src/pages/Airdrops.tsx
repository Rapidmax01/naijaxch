import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Gift, Filter, Loader2, AlertTriangle, Search, ChevronDown } from 'lucide-react'
import { fetchAirdrops } from '../services/airdrops'
import { AirdropCard } from '../components/airdrops/AirdropCard'
import type { Airdrop } from '../types'

const STATUS_TABS = [
  { label: 'Active', value: 'active' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Ended', value: 'ended' },
] as const

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'DeFi', value: 'defi' },
  { label: 'NFT', value: 'nft' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Layer2', value: 'layer2' },
  { label: 'Other', value: 'other' },
] as const

const PAGE_SIZE = 12

type StatusFilter = 'active' | 'upcoming' | 'ended'

export default function Airdrops() {
  const [status, setStatus] = useState<StatusFilter>('active')
  const [category, setCategory] = useState<string>('')
  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['airdrops', status, category],
    queryFn: () =>
      fetchAirdrops({
        status,
        category: category || undefined,
        limit: 200,
        offset: 0,
      }),
  })

  const allAirdrops: Airdrop[] = data?.airdrops || []
  const total = data?.total || 0

  // Separate featured and non-featured
  const featuredAirdrops = allAirdrops.filter((a) => a.is_featured)
  const regularAirdrops = allAirdrops.filter((a) => !a.is_featured)

  // Paginate regular airdrops
  const visibleRegular = regularAirdrops.slice(0, loadedCount)
  const hasMore = loadedCount < regularAirdrops.length

  const handleStatusChange = (newStatus: StatusFilter) => {
    setStatus(newStatus)
    setLoadedCount(PAGE_SIZE)
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    setLoadedCount(PAGE_SIZE)
  }

  const handleLoadMore = () => {
    setLoadedCount((prev) => prev + PAGE_SIZE)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Gift className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Airdrops</h1>
        </div>
        <p className="text-gray-600">
          Discover free token airdrops from top crypto projects. Get in early and earn rewards.
        </p>
      </div>

      {/* Status Tabs + Category Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  status === tab.value
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="relative">
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="input pr-8 appearance-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading airdrops...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
          <p className="text-red-600 font-medium">Failed to load airdrops</p>
          <p className="text-gray-500 text-sm mt-1">
            {error instanceof Error ? error.message : 'Please try again later'}
          </p>
        </div>
      ) : allAirdrops.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No airdrops found</p>
          <p className="text-gray-400 text-sm mt-1">
            Try a different status or category filter
          </p>
        </div>
      ) : (
        <>
          {/* Featured Section */}
          {featuredAirdrops.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Airdrops</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredAirdrops.map((airdrop) => (
                  <AirdropCard
                    key={airdrop.id}
                    airdrop={airdrop}
                    featured
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Airdrops Grid */}
          {visibleRegular.length > 0 && (
            <div>
              {featuredAirdrops.length > 0 && (
                <h2 className="text-xl font-bold text-gray-900 mb-4">All Airdrops</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleRegular.map((airdrop) => (
                  <AirdropCard key={airdrop.id} airdrop={airdrop} />
                ))}
              </div>
            </div>
          )}

          {/* Results summary */}
          <div className="text-center text-sm text-gray-500">
            Showing {featuredAirdrops.length + visibleRegular.length} of {total} airdrops
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                className="btn btn-secondary px-8 py-3 font-semibold"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
