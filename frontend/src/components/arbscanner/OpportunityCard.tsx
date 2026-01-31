import { ArrowRight, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import { formatNaira, formatPercent } from '../../utils/formatters'
import type { ArbitrageOpportunity } from '../../types'

interface Props {
  opportunity: ArbitrageOpportunity
  highlight?: boolean
  onCalculate?: (opp: ArbitrageOpportunity) => void
}

export function OpportunityCard({ opportunity, highlight, onCalculate }: Props) {
  const isProfitable = opportunity.is_profitable

  return (
    <div
      className={`rounded-xl p-6 transition-all ${
        highlight
          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl'
          : 'bg-white shadow-lg hover:shadow-xl'
      }`}
    >
      {highlight && (
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" />
          <span className="font-bold">Best Opportunity</span>
        </div>
      )}

      {/* Exchange Flow */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center">
          <p className={`text-xs uppercase tracking-wide mb-1 ${
            highlight ? 'text-green-100' : 'text-gray-500'
          }`}>
            Buy on
          </p>
          <p className="font-bold text-lg capitalize">
            {opportunity.buy_exchange.replace('_', ' ')}
          </p>
          <p className={`text-xl font-bold ${highlight ? '' : 'text-green-600'}`}>
            {formatNaira(opportunity.buy_price)}
          </p>
        </div>

        <div className="flex flex-col items-center px-4">
          <ArrowRight className={`w-6 h-6 ${highlight ? 'text-white' : 'text-gray-400'}`} />
          <span className={`text-xs mt-1 ${highlight ? 'text-green-100' : 'text-gray-500'}`}>
            {opportunity.crypto}
          </span>
        </div>

        <div className="text-center">
          <p className={`text-xs uppercase tracking-wide mb-1 ${
            highlight ? 'text-green-100' : 'text-gray-500'
          }`}>
            Sell on
          </p>
          <p className="font-bold text-lg capitalize">
            {opportunity.sell_exchange.replace('_', ' ')}
          </p>
          <p className={`text-xl font-bold ${highlight ? '' : 'text-red-600'}`}>
            {formatNaira(opportunity.sell_price)}
          </p>
        </div>
      </div>

      {/* Profit breakdown */}
      <div className={`border-t pt-4 space-y-2 ${
        highlight ? 'border-white/20' : 'border-gray-100'
      }`}>
        <div className="flex justify-between">
          <span className={highlight ? 'text-green-100' : 'text-gray-500'}>
            Gross Spread
          </span>
          <span className="font-medium">
            {formatNaira(opportunity.gross_spread)} ({formatPercent(opportunity.gross_spread_percent)})
          </span>
        </div>

        <div className="flex justify-between">
          <span className={highlight ? 'text-green-100' : 'text-gray-500'}>
            Est. Fees
          </span>
          <span>{formatNaira(opportunity.fees.total)}</span>
        </div>

        <div className="flex justify-between text-lg pt-2 border-t border-dashed">
          <span className="font-bold">Net Profit</span>
          <span className={`font-bold flex items-center gap-1 ${
            isProfitable
              ? highlight ? 'text-yellow-300' : 'text-green-600'
              : 'text-red-500'
          }`}>
            {isProfitable ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {formatPercent(opportunity.net_profit_percent)}
          </span>
        </div>
      </div>

      {/* Action button */}
      {onCalculate && (
        <button
          onClick={() => onCalculate(opportunity)}
          className={`w-full mt-4 py-3 rounded-lg font-semibold transition ${
            highlight
              ? 'bg-white text-green-600 hover:bg-green-50'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          Calculate Trade
        </button>
      )}
    </div>
  )
}
