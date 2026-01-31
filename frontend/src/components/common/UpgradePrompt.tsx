import { Link } from 'react-router-dom'
import { Lock, TrendingUp, Zap, BarChart3 } from 'lucide-react'

interface UpgradePromptProps {
  title?: string
  message: string
  currentPlan?: string
  requiredPlan?: string
  product?: 'arbscanner' | 'ngxradar'
  compact?: boolean
}

export default function UpgradePrompt({
  title = 'Upgrade Required',
  message,
  currentPlan,
  requiredPlan,
  product = 'arbscanner',
  compact = false,
}: UpgradePromptProps) {
  const Icon = product === 'arbscanner' ? Zap : BarChart3

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-800 dark:text-amber-200">{message}</span>
        </div>
        <Link
          to="/pricing"
          className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
        >
          Upgrade
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{message}</p>

          {currentPlan && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
              Current plan: <span className="capitalize font-medium">{currentPlan}</span>
              {requiredPlan && (
                <>
                  {' '}
                  • Upgrade to{' '}
                  <span className="capitalize font-medium text-blue-600 dark:text-blue-400">
                    {requiredPlan}
                  </span>{' '}
                  or higher
                </>
              )}
            </p>
          )}

          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            View Plans
          </Link>
        </div>
      </div>
    </div>
  )
}

// Hook to handle API limit errors
export function useLimitError() {
  const handleLimitError = (error: any): { isLimitError: boolean; message: string; plan?: string } => {
    if (error?.response?.status === 403) {
      const detail = error.response.data?.detail
      if (detail?.error === 'plan_limit_exceeded' || detail?.error === 'plan_required') {
        return {
          isLimitError: true,
          message: detail.message || 'You have reached your plan limit.',
          plan: detail.current_plan,
        }
      }
      if (detail?.error === 'crypto_not_allowed') {
        return {
          isLimitError: true,
          message: detail.message || 'This feature is not available on your plan.',
          plan: undefined,
        }
      }
    }
    return { isLimitError: false, message: '' }
  }

  return { handleLimitError }
}

// Component to show remaining quota
interface QuotaDisplayProps {
  label: string
  used: number
  limit: number
  product?: 'arbscanner' | 'ngxradar'
}

export function QuotaDisplay({ label, used, limit }: QuotaDisplayProps) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <span
          className={`text-sm font-medium ${
            isAtLimit
              ? 'text-red-600 dark:text-red-400'
              : isNearLimit
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-900 dark:text-white'
          }`}
        >
          {isUnlimited ? (
            'Unlimited'
          ) : (
            <>
              {used} / {limit}
            </>
          )}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isAtLimit && (
        <Link
          to="/pricing"
          className="block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Upgrade for more
        </Link>
      )}
    </div>
  )
}
