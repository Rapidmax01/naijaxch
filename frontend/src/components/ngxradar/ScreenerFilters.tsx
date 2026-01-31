import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, X } from 'lucide-react'
import { getSectors } from '../../services/ngx'

export interface FilterState {
  sector?: string
  min_price?: number
  max_price?: number
  min_change_percent?: number
  max_change_percent?: number
  min_volume?: number
}

interface ScreenerFiltersProps {
  onFilterChange: (filters: FilterState) => void
}

export function ScreenerFilters({ onFilterChange }: ScreenerFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [isOpen, setIsOpen] = useState(false)

  const { data: sectors } = useQuery({
    queryKey: ['ngx-sectors'],
    queryFn: getSectors,
  })

  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const updateFilter = (key: keyof FilterState, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined).length

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Sector */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Sector</label>
            <select
              value={filters.sector || ''}
              onChange={(e) => updateFilter('sector', e.target.value)}
              className="input w-full"
            >
              <option value="">All Sectors</option>
              {sectors?.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Min Price</label>
            <input
              type="number"
              placeholder="₦0"
              value={filters.min_price || ''}
              onChange={(e) => updateFilter('min_price', e.target.value ? Number(e.target.value) : undefined)}
              className="input w-full"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Max Price</label>
            <input
              type="number"
              placeholder="No limit"
              value={filters.max_price || ''}
              onChange={(e) => updateFilter('max_price', e.target.value ? Number(e.target.value) : undefined)}
              className="input w-full"
            />
          </div>

          {/* Min Change % */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Min Change %</label>
            <input
              type="number"
              step="0.1"
              placeholder="-100%"
              value={filters.min_change_percent || ''}
              onChange={(e) => updateFilter('min_change_percent', e.target.value ? Number(e.target.value) : undefined)}
              className="input w-full"
            />
          </div>

          {/* Max Change % */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Max Change %</label>
            <input
              type="number"
              step="0.1"
              placeholder="+100%"
              value={filters.max_change_percent || ''}
              onChange={(e) => updateFilter('max_change_percent', e.target.value ? Number(e.target.value) : undefined)}
              className="input w-full"
            />
          </div>

          {/* Min Volume */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Min Volume</label>
            <select
              value={filters.min_volume || ''}
              onChange={(e) => updateFilter('min_volume', e.target.value ? Number(e.target.value) : undefined)}
              className="input w-full"
            >
              <option value="">Any</option>
              <option value={100000}>100K+</option>
              <option value={500000}>500K+</option>
              <option value={1000000}>1M+</option>
              <option value={5000000}>5M+</option>
              <option value={10000000}>10M+</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
