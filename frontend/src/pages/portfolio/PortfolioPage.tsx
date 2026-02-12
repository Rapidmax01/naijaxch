import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, RefreshCw, AlertTriangle, Wallet } from 'lucide-react'
import { fetchPortfolio, addHolding, deleteHolding } from '../../services/portfolio'
import { PortfolioChart } from '../../components/portfolio/PortfolioChart'
import { HoldingsTable } from '../../components/portfolio/HoldingsTable'
import { AddHoldingModal } from '../../components/portfolio/AddHoldingModal'
import { formatNaira, formatPercent } from '../../utils/formatters'
import type { PortfolioSummary, PortfolioHolding } from '../../types'

export default function PortfolioPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data, isLoading, error, refetch, isFetching } = useQuery<PortfolioSummary>({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
  })

  const addMutation = useMutation({
    mutationFn: addHolding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      setIsModalOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHolding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    },
  })

  const handleAddHolding = (holdingData: {
    crypto: string
    amount: number
    buy_price_ngn: number
    notes?: string
  }) => {
    addMutation.mutate(holdingData)
  }

  const handleDeleteHolding = (id: string) => {
    deleteMutation.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
        <div className="card animate-pulse h-64"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <span>Failed to load portfolio</span>
        </div>
        <button onClick={() => refetch()} className="btn btn-secondary">
          Try Again
        </button>
      </div>
    )
  }

  const summary = data
  const holdings: PortfolioHolding[] = summary?.portfolio?.holdings ?? []
  const totalValue = summary?.total_value_ngn ?? 0
  const totalCost = summary?.total_cost_ngn ?? 0
  const totalPnl = summary?.total_pnl_ngn ?? 0
  const totalPnlPercent = summary?.total_pnl_percent ?? 0
  const allocation = summary?.allocation ?? []
  const isProfitable = totalPnl >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Tracker</h1>
          <p className="text-gray-600">
            Track your crypto holdings and performance in Naira
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Holding
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Total Value</p>
          <p className="text-xl font-bold text-gray-900">{formatNaira(totalValue)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Total Cost</p>
          <p className="text-xl font-bold text-gray-900">{formatNaira(totalCost)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">P&L</p>
          <p className={`text-xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {formatNaira(totalPnl)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">P&L %</p>
          <p className={`text-xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(totalPnlPercent)}
          </p>
        </div>
      </div>

      {/* Chart and Holdings */}
      {holdings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-2">No Holdings Yet</h3>
          <p className="text-gray-500 mb-4">
            Add your first crypto holding to start tracking your portfolio performance.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            Add Your First Holding
          </button>
        </div>
      ) : (
        <>
          {/* Allocation Chart */}
          {allocation.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h2>
              <PortfolioChart allocation={allocation} />
            </div>
          )}

          {/* Holdings Table */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Holdings</h2>
            <HoldingsTable holdings={holdings} onDelete={handleDeleteHolding} />
          </div>
        </>
      )}

      {/* Add Holding Modal */}
      <AddHoldingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddHolding}
      />
    </div>
  )
}
