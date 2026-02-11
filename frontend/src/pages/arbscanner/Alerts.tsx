import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Plus, Trash2, Loader2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { fetchAlerts, createAlert, deleteAlert, updateAlert } from '../../services/arbscanner'
import { useAuthStore } from '../../store/authStore'
import { Link } from 'react-router-dom'
import type { Alert } from '../../types'

export default function Alerts() {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newAlert, setNewAlert] = useState({
    crypto: '',
    min_spread_percent: 1.0,
    notify_telegram: true,
    notify_email: false,
  })

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    enabled: isAuthenticated,
  })

  const createMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Alert> }) => updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const resetForm = () => {
    setShowCreate(false)
    setEditingId(null)
    setNewAlert({
      crypto: '',
      min_spread_percent: 1.0,
      notify_telegram: true,
      notify_email: false,
    })
  }

  const handleEdit = (alert: Alert) => {
    setEditingId(alert.id)
    setNewAlert({
      crypto: alert.crypto || '',
      min_spread_percent: alert.min_spread_percent,
      notify_telegram: alert.notify_telegram,
      notify_email: alert.notify_email,
    })
    setShowCreate(true)
  }

  const handleToggle = (alert: Alert) => {
    updateMutation.mutate({ id: alert.id, data: { is_active: !alert.is_active } })
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: newAlert })
    } else {
      createMutation.mutate(newAlert)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sign in to manage alerts
        </h2>
        <p className="text-gray-600 mb-6">
          Create custom arbitrage alerts and get notified via Telegram when
          opportunities match your criteria.
        </p>
        <Link to="/login" className="btn btn-primary">
          Login to Continue
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Arbitrage Alerts</h1>
          <p className="text-gray-600">
            Get notified when opportunities match your criteria
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true) }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Alert
        </button>
      </div>

      {/* Create/Edit Alert Form */}
      {showCreate && (
        <div className="card border-2 border-primary-200">
          <h3 className="font-semibold mb-4">
            {editingId ? 'Edit Alert' : 'Create New Alert'}
          </h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cryptocurrency (optional)
                </label>
                <select
                  value={newAlert.crypto}
                  onChange={(e) => setNewAlert({ ...newAlert, crypto: e.target.value })}
                  className="input"
                >
                  <option value="">All Cryptos</option>
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Spread %
                </label>
                <input
                  type="number"
                  value={newAlert.min_spread_percent}
                  onChange={(e) => setNewAlert({ ...newAlert, min_spread_percent: Number(e.target.value) })}
                  className="input"
                  min={0}
                  step={0.1}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAlert.notify_telegram}
                  onChange={(e) => setNewAlert({ ...newAlert, notify_telegram: e.target.checked })}
                  className="rounded"
                />
                <span>Telegram</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAlert.notify_email}
                  onChange={(e) => setNewAlert({ ...newAlert, notify_email: e.target.checked })}
                  className="rounded"
                />
                <span>Email</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {editingId ? 'Save Changes' : 'Create Alert'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts List */}
      {isLoading ? (
        <div className="card animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="card divide-y">
          {alerts.map((alert) => (
            <div key={alert.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {alert.crypto || 'All Cryptos'} - Min {alert.min_spread_percent}% spread
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-3">
                  {alert.notify_telegram && <span>Telegram</span>}
                  {alert.notify_email && <span>Email</span>}
                  <span className={alert.is_active ? 'text-green-600' : 'text-gray-400'}>
                    {alert.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(alert)}
                  disabled={updateMutation.isPending}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title={alert.is_active ? 'Pause alert' : 'Activate alert'}
                >
                  {alert.is_active ? (
                    <ToggleRight className="w-6 h-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(alert)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                  title="Edit alert"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(alert.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Delete alert"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-2">No Alerts Yet</h3>
          <p className="text-gray-500 mb-4">
            Create an alert to get notified when arbitrage opportunities appear.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn btn-primary"
          >
            Create First Alert
          </button>
        </div>
      )}

      {/* Telegram Setup */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          Link your Telegram account
        </h3>
        <p className="text-blue-800 text-sm mb-3">
          To receive Telegram alerts, start a chat with our bot and link your account.
        </p>
        <a
          href="https://t.me/NaijaTradeBot"
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-blue-600 text-white hover:bg-blue-700 inline-block"
        >
          Open @NaijaTradeBot
        </a>
      </div>
    </div>
  )
}
