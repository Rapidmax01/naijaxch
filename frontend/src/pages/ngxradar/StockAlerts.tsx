import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Bell, Trash2, Power } from 'lucide-react'
import { getStockAlerts, deleteStockAlert, toggleStockAlert } from '../../services/ngx'
import { useAuthStore } from '../../store/authStore'
import type { StockAlert } from '../../types'

const ALERT_TYPES = {
  price_above: 'Price above',
  price_below: 'Price below',
  percent_change: 'Change exceeds',
}

export default function StockAlerts() {
  const { isAuthenticated } = useAuthStore()
  const [showAll, setShowAll] = useState(false)
  const queryClient = useQueryClient()

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['ngx-alerts', showAll],
    queryFn: () => getStockAlerts(!showAll),
    enabled: isAuthenticated,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStockAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngx-alerts'] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: toggleStockAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngx-alerts'] })
    },
  })

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <Link
          to="/ngx"
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to NGX Radar
        </Link>

        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to use Alerts</h2>
          <p className="text-gray-600 mb-4">
            Get notified when stocks hit your target prices
          </p>
          <Link to="/login" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/ngx"
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to NGX Radar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Stock Alerts</h1>
          <p className="text-gray-600">Get notified when prices hit your targets</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">Show triggered alerts</span>
        </label>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert: StockAlert) => (
            <div
              key={alert.id}
              className={`card ${!alert.is_active ? 'opacity-60' : ''} ${alert.is_triggered ? 'border-green-500 bg-green-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${alert.is_triggered ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Bell className={`w-5 h-5 ${alert.is_triggered ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/ngx/stocks/${alert.stock_symbol}`}
                        className="font-semibold text-primary-600 hover:text-primary-700"
                      >
                        {alert.stock_symbol}
                      </Link>
                      <span className="text-gray-600">{alert.stock_name}</span>
                      {alert.is_triggered && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Triggered
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {ALERT_TYPES[alert.alert_type]}:{' '}
                      <span className="font-medium">
                        {alert.alert_type === 'percent_change'
                          ? `${alert.target_value}%`
                          : `₦${alert.target_value.toLocaleString()}`}
                      </span>
                      {alert.current_price && (
                        <span className="text-gray-500 ml-2">
                          (Current: ₦{alert.current_price.toLocaleString()})
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {alert.notify_telegram && <span>Telegram</span>}
                      {alert.notify_email && <span>Email</span>}
                      <span>Created {new Date(alert.created_at).toLocaleDateString()}</span>
                      {alert.triggered_at && (
                        <span>Triggered {new Date(alert.triggered_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMutation.mutate(alert.id)}
                    className={`p-2 rounded hover:bg-gray-100 ${alert.is_active ? 'text-green-600' : 'text-gray-400'}`}
                    title={alert.is_active ? 'Disable alert' : 'Enable alert'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this alert?')) {
                        deleteMutation.mutate(alert.id)
                      }
                    }}
                    className="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No alerts yet</h2>
          <p className="text-gray-600 mb-4">
            Set alerts from the stock detail page to get notified when prices hit your targets
          </p>
          <Link to="/ngx" className="btn btn-primary">
            Browse Stocks
          </Link>
        </div>
      )}

      {/* Info */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">How Alerts Work</h3>
            <p className="text-blue-800 text-sm mt-1">
              Set price targets and get notified via Telegram when stocks hit your
              target prices. Alerts are checked whenever stock prices are updated
              during market hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
