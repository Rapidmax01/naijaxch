import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, CheckCircle, Star, Bot } from 'lucide-react'
import { fetchAirdrops, deleteAirdrop } from '../../services/airdrops'
import type { Airdrop } from '../../types'
import AirdropFormModal from './AirdropFormModal'

export default function AirdropAdminTab() {
  const queryClient = useQueryClient()
  const [editingAirdrop, setEditingAirdrop] = useState<Airdrop | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-airdrops'],
    queryFn: () => fetchAirdrops({ limit: 100 }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAirdrop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-airdrops'] })
      queryClient.invalidateQueries({ queryKey: ['airdrops'] })
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
    setEditingAirdrop(null)
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading airdrops...</div>
  }

  const airdrops = data?.airdrops ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Airdrops ({airdrops.length})</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Airdrop</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Difficulty</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Flags</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {airdrops.map((airdrop) => (
              <tr key={airdrop.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{airdrop.name}</td>
                <td className="px-4 py-3 text-gray-600">{airdrop.project}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={airdrop.status} />
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{airdrop.category}</td>
                <td className="px-4 py-3 text-gray-600 capitalize">{airdrop.difficulty}</td>
                <td className="px-4 py-3">
                  <div className="flex space-x-1">
                    {airdrop.is_featured && (
                      <span title="Featured"><Star className="w-4 h-4 text-yellow-500" /></span>
                    )}
                    {airdrop.is_verified && (
                      <span title="Verified"><CheckCircle className="w-4 h-4 text-green-500" /></span>
                    )}
                    {airdrop.is_auto_curated && (
                      <span title="Auto-curated"><Bot className="w-4 h-4 text-blue-500" /></span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setEditingAirdrop(airdrop)}
                      className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(airdrop.id)}
                      className={`p-1.5 rounded-lg transition ${
                        deleteConfirm === airdrop.id
                          ? 'text-white bg-red-600 hover:bg-red-700'
                          : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={deleteConfirm === airdrop.id ? 'Click again to confirm' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {airdrops.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No airdrops yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(showCreateModal || editingAirdrop) && (
        <AirdropFormModal airdrop={editingAirdrop} onClose={handleModalClose} />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    upcoming: 'bg-blue-100 text-blue-700',
    ended: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? colors.active}`}>
      {status}
    </span>
  )
}
