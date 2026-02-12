import type { TradingSignal } from '../../types'
import { formatRelativeTime } from '../../utils/formatters'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  ShieldAlert,
  ArrowRightCircle,
} from 'lucide-react'

interface SignalCardProps {
  signal: TradingSignal
}

function directionBadge(direction: string) {
  const isBuy = direction.toUpperCase() === 'BUY'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
        isBuy
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {isBuy ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      {direction.toUpperCase()}
    </span>
  )
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-yellow-100 text-yellow-800',
  }
  const cls = styles[status.toLowerCase()] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  )
}

function resultBadge(result: string | undefined, resultPercent: number | undefined) {
  if (!result) return null

  const styles: Record<string, string> = {
    win: 'bg-green-100 text-green-800',
    loss: 'bg-red-100 text-red-800',
    breakeven: 'bg-gray-100 text-gray-700',
  }
  const cls = styles[result.toLowerCase()] ?? 'bg-gray-100 text-gray-700'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold capitalize ${cls}`}>
      {result}
      {resultPercent !== undefined && (
        <span>({resultPercent >= 0 ? '+' : ''}{resultPercent.toFixed(2)}%)</span>
      )}
    </span>
  )
}

function timeframeBadge(timeframe: string | undefined) {
  if (!timeframe) return null

  const styles: Record<string, string> = {
    short: 'bg-purple-100 text-purple-700',
    medium: 'bg-indigo-100 text-indigo-700',
    long: 'bg-teal-100 text-teal-700',
  }
  const cls = styles[timeframe.toLowerCase()] ?? 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium capitalize ${cls}`}>
      <Clock className="w-3 h-3" />
      {timeframe}
    </span>
  )
}

export function SignalCard({ signal }: SignalCardProps) {
  const formatPrice = (price: number) =>
    price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="card flex flex-col gap-3">
      {/* Top row: direction badge + asset info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {directionBadge(signal.direction)}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{signal.asset_symbol}</h3>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{signal.asset_type}</p>
          </div>
        </div>
        {statusBadge(signal.status)}
      </div>

      {/* Price levels */}
      <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <ArrowRightCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium uppercase">Entry</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{formatPrice(signal.entry_price)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <Target className="w-3.5 h-3.5" />
            <span className="text-xs font-medium uppercase">Target</span>
          </div>
          <p className="text-sm font-bold text-green-700">
            {signal.target_price !== undefined ? formatPrice(signal.target_price) : '--'}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-xs font-medium uppercase">Stop Loss</span>
          </div>
          <p className="text-sm font-bold text-red-700">
            {signal.stop_loss !== undefined ? formatPrice(signal.stop_loss) : '--'}
          </p>
        </div>
      </div>

      {/* Reasoning */}
      {signal.reasoning && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {signal.reasoning}
        </p>
      )}

      {/* Bottom row: tags + timestamp */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          {timeframeBadge(signal.timeframe)}
          {signal.status.toLowerCase() === 'closed' &&
            resultBadge(signal.result, signal.result_percent)}
        </div>
        <span className="text-xs text-gray-400">{formatRelativeTime(signal.created_at)}</span>
      </div>
    </div>
  )
}
