import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Newspaper, Loader2, AlertTriangle } from 'lucide-react'
import { fetchNewsFeed } from '../services/news'
import { NewsCard } from '../components/news/NewsCard'
import type { NewsItem } from '../types'

const CATEGORIES = [
  { label: 'All', value: undefined },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Stocks', value: 'stocks' },
  { label: 'Nigeria', value: 'nigeria' },
] as const

const PAGE_SIZE = 12

export default function NewsFeed() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const [offset, setOffset] = useState(0)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['news-feed', activeCategory, offset],
    queryFn: () =>
      fetchNewsFeed({
        category: activeCategory,
        limit: PAGE_SIZE,
        offset,
      }),
  })

  const items: NewsItem[] = data?.items || []
  const total = data?.total || 0
  const hasMore = offset + PAGE_SIZE < total

  const handleCategoryChange = (value: string | undefined) => {
    setActiveCategory(value)
    setOffset(0)
  }

  const handleLoadMore = () => {
    setOffset((prev) => prev + PAGE_SIZE)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">News Feed</h1>
        <p className="text-gray-600">
          Stay updated with the latest crypto, stocks, and Nigerian market news
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => handleCategoryChange(cat.value)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeCategory === cat.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && offset === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading news...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
          <p className="text-red-600 font-medium">Failed to load news</p>
          <p className="text-gray-500 text-sm mt-1">
            {error instanceof Error ? error.message : 'Please try again later'}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Newspaper className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No news articles found</p>
          <p className="text-gray-400 text-sm mt-1">
            Try selecting a different category
          </p>
        </div>
      ) : (
        <>
          {/* News Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: NewsItem) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="btn btn-secondary px-8 py-3 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}

          {/* Results info */}
          <p className="text-center text-sm text-gray-400">
            Showing {Math.min(offset + PAGE_SIZE, total)} of {total} articles
          </p>
        </>
      )}
    </div>
  )
}
