import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import {
  fetchDcaPlans,
  createDcaPlan,
  deleteDcaPlan,
  addDcaEntry,
  deleteDcaEntry,
} from '../../services/dca'
import { LogEntryModal } from '../../components/dca/LogEntryModal'
import { DcaChart } from '../../components/dca/DcaChart'
import { formatNaira, formatPercent } from '../../utils/formatters'
import type { DcaPlan, DcaEntry } from '../../types'

const CRYPTOS = ['USDT', 'BTC', 'ETH']
const FREQUENCIES = ['daily', 'weekly', 'monthly']

export default function DcaTracker() {
  const queryClient = useQueryClient()

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)

  // Create plan form state
  const [newPlan, setNewPlan] = useState({
    name: '',
    crypto: 'USDT',
    frequency: 'weekly',
    target_amount_ngn: '',
  })

  // Fetch all plans
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dca-plans'],
    queryFn: fetchDcaPlans,
  })

  const plans: DcaPlan[] = data?.plans ?? []
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null

  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: createDcaPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dca-plans'] })
      setShowCreateForm(false)
      setNewPlan({ name: '', crypto: 'USDT', frequency: 'weekly', target_amount_ngn: '' })
    },
  })

  const deletePlanMutation = useMutation({
    mutationFn: deleteDcaPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dca-plans'] })
      if (selectedPlanId) setSelectedPlanId(null)
    },
  })

  const addEntryMutation = useMutation({
    mutationFn: (data: {
      date: string
      amount_ngn: number
      price_per_unit_ngn: number
      crypto_amount: number
      exchange?: string
      notes?: string
    }) => {
      if (!selectedPlanId) throw new Error('No plan selected')
      return addDcaEntry(selectedPlanId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dca-plans'] })
      setShowLogModal(false)
    },
  })

  const deleteEntryMutation = useMutation({
    mutationFn: deleteDcaEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dca-plans'] })
    },
  })

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault()
    const target = newPlan.target_amount_ngn
      ? Number(newPlan.target_amount_ngn)
      : undefined
    createPlanMutation.mutate({
      name: newPlan.name,
      crypto: newPlan.crypto,
      frequency: newPlan.frequency,
      target_amount_ngn: target,
    })
  }

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this DCA plan and all its entries?')) {
      deletePlanMutation.mutate(planId)
    }
  }

  const handleLogEntry = (data: {
    date: string
    amount_ngn: number
    price_per_unit_ngn: number
    crypto_amount: number
    exchange?: string
    notes?: string
  }) => {
    addEntryMutation.mutate(data)
  }

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Delete this entry?')) {
      deleteEntryMutation.mutate(entryId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DCA Tracker</h1>
          <p className="text-gray-600">
            Track your dollar-cost averaging strategy across Nigerian exchanges
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Plan
        </button>
      </div>

      {/* Create Plan Form */}
      {showCreateForm && (
        <div className="card border-2 border-primary-200">
          <h3 className="font-semibold text-gray-900 mb-4">Create DCA Plan</h3>
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g. Weekly USDT Stack"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cryptocurrency
                </label>
                <select
                  value={newPlan.crypto}
                  onChange={(e) => setNewPlan({ ...newPlan, crypto: e.target.value })}
                  className="input w-full"
                >
                  {CRYPTOS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={newPlan.frequency}
                  onChange={(e) => setNewPlan({ ...newPlan, frequency: e.target.value })}
                  className="input w-full"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount (NGN)
                  <span className="text-gray-400 font-normal ml-2">(optional)</span>
                </label>
                <input
                  type="number"
                  value={newPlan.target_amount_ngn}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, target_amount_ngn: e.target.value })
                  }
                  className="input w-full"
                  placeholder="e.g. 1000000"
                  min={0}
                  step="any"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createPlanMutation.isPending || !newPlan.name}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPlanMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Create Plan
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main layout: sidebar + content */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Plan list sidebar */}
        <div className="lg:col-span-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Your Plans</h3>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <p className="text-red-500 text-sm">Failed to load plans. Please try again.</p>
            ) : plans.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">
                  No DCA plans yet. Create one to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`w-full text-left p-3 rounded-lg border transition flex items-center justify-between group ${
                      selectedPlanId === plan.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {plan.name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-mono">{plan.crypto}</span>
                        <span className="text-gray-300">|</span>
                        <span className="capitalize">{plan.frequency}</span>
                        <span className="text-gray-300">|</span>
                        <span
                          className={
                            plan.is_active ? 'text-green-600' : 'text-gray-400'
                          }
                        >
                          {plan.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 transition ${
                        selectedPlanId === plan.id
                          ? 'text-primary-500'
                          : 'text-gray-300 group-hover:text-gray-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Plan detail */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPlan ? (
            <PlanDetail
              plan={selectedPlan}
              onLogPurchase={() => setShowLogModal(true)}
              onDeletePlan={handleDeletePlan}
              onDeleteEntry={handleDeleteEntry}
              isDeletingEntry={deleteEntryMutation.isPending}
            />
          ) : (
            <div className="card text-center py-16">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="font-semibold text-gray-700 mb-2">Select a Plan</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Choose a DCA plan from the sidebar to view your purchase history,
                performance stats, and price chart.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Log Entry Modal */}
      {selectedPlan && (
        <LogEntryModal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          onSubmit={handleLogEntry}
          crypto={selectedPlan.crypto}
        />
      )}
    </div>
  )
}

// ---- Plan Detail Sub-component ----

interface PlanDetailProps {
  plan: DcaPlan
  onLogPurchase: () => void
  onDeletePlan: (planId: string) => void
  onDeleteEntry: (entryId: string) => void
  isDeletingEntry: boolean
}

function PlanDetail({
  plan,
  onLogPurchase,
  onDeletePlan,
  onDeleteEntry,
  isDeletingEntry,
}: PlanDetailProps) {
  const totalInvested = plan.total_invested_ngn ?? 0
  const avgCost = plan.avg_cost_ngn ?? null
  const currentPrice = plan.current_price_ngn ?? null
  const pnl = plan.pnl_ngn ?? 0
  const pnlPercent = plan.pnl_percent ?? 0
  const entries: DcaEntry[] = plan.entries ?? []

  const sortedEntries = entries
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <>
      {/* Plan header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
          <p className="text-gray-500 text-sm">
            {plan.crypto} -- {plan.frequency} -- {entries.length} entries
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onLogPurchase}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Purchase
          </button>
          <button
            onClick={() => onDeletePlan(plan.id)}
            className="btn btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Invested"
          value={formatNaira(totalInvested)}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label="Avg Cost"
          value={avgCost !== null ? formatNaira(avgCost) : '--'}
          icon={<Target className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          label="Current Price"
          value={currentPrice !== null ? formatNaira(currentPrice) : '--'}
          icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          label="P&L"
          value={formatNaira(pnl)}
          subtitle={formatPercent(pnlPercent)}
          valueColor={pnl >= 0 ? 'text-green-600' : 'text-red-600'}
          icon={
            pnl >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )
          }
        />
      </div>

      {/* Chart */}
      <DcaChart entries={entries} avgCost={avgCost} currentPrice={currentPrice} />

      {/* Entry log table */}
      <div className="card overflow-hidden">
        <h3 className="font-semibold text-gray-900 mb-4">Purchase History</h3>

        {sortedEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              No entries yet. Click "Log Purchase" to record your first buy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">
                    Amount (NGN)
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">
                    Price (NGN)
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">
                    {plan.crypto} Amount
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Exchange
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-900">
                      {new Date(entry.date).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-900 font-mono">
                      {formatNaira(entry.amount_ngn)}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-900 font-mono">
                      {formatNaira(entry.price_per_unit_ngn)}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-900 font-mono">
                      {entry.crypto_amount.toFixed(8)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {entry.exchange || '--'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        disabled={isDeletingEntry}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ---- Stat Card ----

interface StatCardProps {
  label: string
  value: string
  subtitle?: string
  valueColor?: string
  icon: React.ReactNode
}

function StatCard({ label, value, subtitle, valueColor, icon }: StatCardProps) {
  return (
    <div className="card flex items-start gap-3">
      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-lg font-bold truncate ${valueColor ?? 'text-gray-900'}`}>
          {value}
        </p>
        {subtitle && (
          <p className={`text-sm font-medium ${valueColor ?? 'text-gray-500'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
