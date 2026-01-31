import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, Star } from 'lucide-react'
import { getWatchlists, createWatchlist, deleteWatchlist, removeFromWatchlist } from '../../services/ngx'
import { useAuthStore } from '../../store/authStore'
import type { Stock } from '../../types'

export default function Watchlist() {
  const { isAuthenticated } = useAuthStore()
  const [newListName, setNewListName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: watchlists, isLoading } = useQuery({
    queryKey: ['ngx-watchlists'],
    queryFn: getWatchlists,
    enabled: isAuthenticated,
  })

  const createMutation = useMutation({
    mutationFn: createWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngx-watchlists'] })
      setNewListName('')
      setShowCreateForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngx-watchlists'] })
    },
  })

  const removeStockMutation = useMutation({
    mutationFn: ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) =>
      removeFromWatchlist(watchlistId, symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngx-watchlists'] })
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
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to use Watchlists</h2>
          <p className="text-gray-600 mb-4">
            Create watchlists to track your favorite stocks
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
          <h1 className="text-3xl font-bold text-gray-900">Watchlists</h1>
          <p className="text-gray-600">Track your favorite stocks</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Watchlist
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Create Watchlist</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (newListName.trim()) {
                createMutation.mutate(newListName.trim())
              }
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Watchlist name"
              className="input flex-1"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newListName.trim() || createMutation.isPending}
              className="btn btn-primary"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Watchlists */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      ) : watchlists && watchlists.length > 0 ? (
        <div className="space-y-6">
          {watchlists.map((list) => (
            <div key={list.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{list.name}</h3>
                <button
                  onClick={() => {
                    if (confirm('Delete this watchlist?')) {
                      deleteMutation.mutate(list.id)
                    }
                  }}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {list.stocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Symbol</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Name</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Price</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Change</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {list.stocks.map((stock: Stock) => {
                        const isPositive = (stock.change_percent || 0) >= 0
                        return (
                          <tr key={stock.symbol} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <Link
                                to={`/ngx/stocks/${stock.symbol}`}
                                className="font-medium text-primary-600 hover:text-primary-700"
                              >
                                {stock.symbol}
                              </Link>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{stock.name}</td>
                            <td className="px-4 py-2 text-right font-medium">
                              ₦{stock.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                            </td>
                            <td className={`px-4 py-2 text-right text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {stock.change_percent !== undefined ? (
                                <>
                                  {isPositive ? '+' : ''}{stock.change_percent.toFixed(2)}%
                                </>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => removeStockMutation.mutate({
                                  watchlistId: list.id,
                                  symbol: stock.symbol,
                                })}
                                className="text-gray-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No stocks in this watchlist. Add stocks from the stock detail page.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No watchlists yet</h2>
          <p className="text-gray-600 mb-4">
            Create a watchlist to start tracking stocks
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Create Watchlist
          </button>
        </div>
      )}
    </div>
  )
}
