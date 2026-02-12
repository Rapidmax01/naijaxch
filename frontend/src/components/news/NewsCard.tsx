import { ExternalLink } from 'lucide-react'
import { formatRelativeTime } from '../../utils/formatters'
import type { NewsItem } from '../../types'

interface Props {
  item: NewsItem
}

const SOURCE_COLORS: Record<string, string> = {
  coindesk: 'bg-blue-100 text-blue-700',
  cointelegraph: 'bg-purple-100 text-purple-700',
  bloomberg: 'bg-orange-100 text-orange-700',
  reuters: 'bg-red-100 text-red-700',
}

function getSourceColor(source: string): string {
  const key = source.toLowerCase()
  return SOURCE_COLORS[key] || 'bg-gray-100 text-gray-700'
}

export function NewsCard({ item }: Props) {
  const timeDisplay = item.published_at
    ? formatRelativeTime(item.published_at)
    : formatRelativeTime(item.fetched_at)

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-200 group flex flex-col">
      {/* Image or gradient fallback */}
      <div className="relative h-44 overflow-hidden">
        {item.image_url ? (
          <>
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement | null
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div
              className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center hidden"
            >
              <span className="text-white text-4xl font-bold opacity-30">
                {item.source.charAt(0).toUpperCase()}
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-white text-4xl font-bold opacity-30">
              {item.source.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Source badge */}
        <span
          className={`absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-medium ${getSourceColor(item.source)}`}
        >
          {item.source}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Time */}
        <p className="text-xs text-gray-400 mb-2">{timeDisplay}</p>

        {/* Title */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-900 font-semibold leading-snug hover:text-primary-600 transition-colors line-clamp-2 mb-2 flex items-start gap-1"
        >
          {item.title}
          <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Summary */}
        {item.summary && (
          <p className="text-sm text-gray-500 line-clamp-3 flex-1">{item.summary}</p>
        )}

        {/* Category tag */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400 uppercase tracking-wide">{item.category}</span>
        </div>
      </div>
    </div>
  )
}
