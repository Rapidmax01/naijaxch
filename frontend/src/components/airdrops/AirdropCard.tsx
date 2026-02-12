import { CheckCircle, ExternalLink, Clock } from 'lucide-react'
import type { Airdrop } from '../../types'

interface Props {
  airdrop: Airdrop
  featured?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  defi: 'bg-purple-100 text-purple-700',
  nft: 'bg-pink-100 text-pink-700',
  gaming: 'bg-orange-100 text-orange-700',
  layer2: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-700',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

const GRADIENT_COLORS = [
  'from-purple-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-orange-500 to-amber-600',
  'from-blue-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-teal-500 to-cyan-600',
]

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.other
}

function getDifficultyColor(difficulty: string): string {
  return DIFFICULTY_COLORS[difficulty.toLowerCase()] || DIFFICULTY_COLORS.medium
}

function getGradient(name: string): string {
  const index = name.charCodeAt(0) % GRADIENT_COLORS.length
  return GRADIENT_COLORS[index]
}

function getDeadlineText(deadline: string): { text: string; isEnded: boolean } {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { text: 'Ended', isEnded: true }
  }

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return { text: '1 day left', isEnded: false }
  }

  return { text: `${diffDays} days left`, isEnded: false }
}

export function AirdropCard({ airdrop, featured = false }: Props) {
  const isEnded = airdrop.status === 'ended'
  const deadlineInfo = airdrop.deadline
    ? getDeadlineText(airdrop.deadline)
    : null

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-200 flex flex-col ${
        featured
          ? 'bg-white shadow-xl hover:shadow-2xl ring-2 ring-primary-200'
          : 'bg-white shadow-lg hover:shadow-xl'
      }`}
    >
      {/* Image / Gradient Header */}
      <div className={`relative overflow-hidden ${featured ? 'h-52' : 'h-40'}`}>
        {airdrop.image_url ? (
          <img
            src={airdrop.image_url}
            alt={airdrop.project}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement | null
              if (fallback) fallback.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className={`w-full h-full bg-gradient-to-br ${getGradient(airdrop.project)} items-center justify-center ${
            airdrop.image_url ? 'hidden' : 'flex'
          }`}
        >
          <span
            className={`text-white font-bold opacity-40 ${
              featured ? 'text-7xl' : 'text-5xl'
            }`}
          >
            {airdrop.project.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Category badge */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor(
            airdrop.category
          )}`}
        >
          {airdrop.category.charAt(0).toUpperCase() + airdrop.category.slice(1)}
        </span>

        {/* Verified badge */}
        {airdrop.is_verified && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-green-700">
            <CheckCircle className="w-3.5 h-3.5" />
            Verified
          </span>
        )}

        {/* Featured label */}
        {featured && airdrop.is_featured && (
          <span className="absolute bottom-3 left-3 bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col flex-1 ${featured ? 'p-6' : 'p-4'}`}>
        {/* Project & Name */}
        <p className={`text-gray-500 text-xs uppercase tracking-wide mb-1 ${featured ? 'text-sm' : ''}`}>
          {airdrop.project}
        </p>
        <h3
          className={`font-bold text-gray-900 leading-snug mb-3 ${
            featured ? 'text-xl' : 'text-base'
          }`}
        >
          {airdrop.name}
        </h3>

        {/* Description (featured only) */}
        {featured && airdrop.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{airdrop.description}</p>
        )}

        {/* Reward & Token */}
        {(airdrop.reward_estimate || airdrop.reward_token) && (
          <div className="flex items-center gap-2 mb-3">
            {airdrop.reward_estimate && (
              <span className={`font-semibold text-green-600 ${featured ? 'text-lg' : 'text-sm'}`}>
                {airdrop.reward_estimate}
              </span>
            )}
            {airdrop.reward_token && (
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                {airdrop.reward_token}
              </span>
            )}
          </div>
        )}

        {/* Tags Row: Difficulty + Deadline */}
        <div className="flex items-center gap-2 flex-wrap mt-auto mb-4">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getDifficultyColor(
              airdrop.difficulty
            )}`}
          >
            {airdrop.difficulty}
          </span>

          {deadlineInfo && (
            <span
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                deadlineInfo.isEnded
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Clock className="w-3 h-3" />
              {deadlineInfo.text}
            </span>
          )}
        </div>

        {/* Action Button */}
        {airdrop.url ? (
          <a
            href={airdrop.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full text-center rounded-lg font-semibold transition inline-flex items-center justify-center gap-2 ${
              featured ? 'py-3 text-base' : 'py-2.5 text-sm'
            } ${
              isEnded
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
            onClick={(e) => {
              if (isEnded) e.preventDefault()
            }}
            aria-disabled={isEnded}
          >
            {isEnded ? 'Ended' : 'Participate'}
            {!isEnded && <ExternalLink className="w-4 h-4" />}
          </a>
        ) : (
          <button
            disabled
            className={`w-full rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed ${
              featured ? 'py-3 text-base' : 'py-2.5 text-sm'
            }`}
          >
            No Link Available
          </button>
        )}
      </div>
    </div>
  )
}
