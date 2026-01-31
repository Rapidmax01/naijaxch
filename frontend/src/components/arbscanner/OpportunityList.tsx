import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { fetchOpportunities } from '../../services/arbscanner'
import { OpportunityCard } from './OpportunityCard'
import type { ArbitrageOpportunity } from '../../types'

interface Props {
  crypto: string
  minSpread?: number
  tradeAmount?: number
  onCalculate?: (opp: ArbitrageOpportunity) => void
}

export function OpportunityList({
  crypto,
  minSpread = 0.5,
  tradeAmount = 100000,
  onCalculate,
}: Props) {
  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ['opportunities', crypto, minSpread, tradeAmount],
    queryFn: () => fetchOpportunities(crypto, minSpread, tradeAmount),
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <span>Failed to load opportunities</span>
        </div>
        <button
          onClick={() => refetch()}
          className="btn btn-secondary"
        >
          Try Again
        </button>
      </div>
    )
  }

  const opportunities = data?.opportunities || []
  const profitableOpps = opportunities.filter((o) => o.is_profitable)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Arbitrage Opportunities</h2>
          <p className="text-sm text-gray-500">
            {profitableOpps.length} profitable out of {opportunities.length} found
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {opportunities.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-2">
            No Opportunities Found
          </h3>
          <p className="text-gray-500 mb-4">
            No arbitrage opportunities meet your criteria right now.
            Try lowering the minimum spread or check back later.
          </p>
          <button
            onClick={() => refetch()}
            className="btn btn-primary"
          >
            Check Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp, index) => (
            <OpportunityCard
              key={`${opp.buy_exchange}-${opp.sell_exchange}`}
              opportunity={opp}
              highlight={index === 0 && opp.is_profitable}
              onCalculate={onCalculate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
