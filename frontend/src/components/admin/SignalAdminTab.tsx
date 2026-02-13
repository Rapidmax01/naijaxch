import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { fetchSignals, deleteSignal } from '../../services/signals'
import type { TradingSignal } from '../../types'
import SignalFormModal from './SignalFormModal'

export default function SignalAdminTab() {
  const queryClient = useQueryClient()
  const [editingSignal, setEditingSignal] = useState<TradingSignal | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-signals'],
    queryFn: () => fetchSignals({ limit: 100 }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSignal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-signals'] })
      queryClient.invalidateQueries({ queryKey: ['signals'] })
      setDeleteConfirm(null)
    },
  })

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteMutation.mutate(id)
    } else {
      setDeleteConfirm(id)
    }
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
    setEditingSignal(null)
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading signals...</div>
  }

  const signals = data?.signals ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Signals ({signals.length})</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Signal</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Asset</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Direction</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Entry</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Target</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stop</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Result</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal) => (
              <tr key={signal.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <span className="text-xs text-gray-400 mr-1">{signal.asset_type}</span>
                  {signal.asset_symbol}
                </td>
                <td className="px-4 py-3">
                  <DirectionBadge direction={signal.direction} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">
                  {signal.entry_price?.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">
                  {signal.target_price?.toLocaleString() ?? '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">
                  {signal.stop_loss?.toLocaleString() ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={signal.status} />
                </td>
                <td className="px-4 py-3">
                  {signal.result ? (
                    <span className={`text-sm font-medium ${signal.result === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                      {signal.result}{signal.result_percent != null ? ` (${signal.result_percent > 0 ? '+' : ''}${signal.result_percent}%)` : ''}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setEditingSignal(signal)}
                      className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(signal.id)}
                      className={`p-1.5 rounded-lg transition ${
                        deleteConfirm === signal.id
                          ? 'text-white bg-red-600 hover:bg-red-700'
                          : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={deleteConfirm === signal.id ? 'Click again to confirm' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {signals.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No signals yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(showCreateModal || editingSignal) && (
        <SignalFormModal signal={editingSignal} onClose={handleModalClose} />
      )}
    </div>
  )
}

function DirectionBadge({ direction }: { direction: string }) {
  const isLong = direction.toLowerCase() === 'long'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      isLong ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {direction}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? colors.open}`}>
      {status}
    </span>
  )
}
