import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { createAirdrop, updateAirdrop } from '../../services/airdrops'
import type { Airdrop } from '../../types'

interface Props {
  airdrop: Airdrop | null
  onClose: () => void
}

export default function AirdropFormModal({ airdrop, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!airdrop

  const [form, setForm] = useState({
    name: airdrop?.name ?? '',
    project: airdrop?.project ?? '',
    description: airdrop?.description ?? '',
    category: airdrop?.category ?? 'defi',
    status: airdrop?.status ?? 'active',
    difficulty: airdrop?.difficulty ?? 'medium',
    reward_estimate: airdrop?.reward_estimate ?? '',
    reward_token: airdrop?.reward_token ?? '',
    requirements: airdrop?.requirements ?? '',
    steps: airdrop?.steps ?? '',
    url: airdrop?.url ?? '',
    image_url: airdrop?.image_url ?? '',
    start_date: airdrop?.start_date ?? '',
    deadline: airdrop?.deadline ?? '',
    is_verified: airdrop?.is_verified ?? false,
    is_featured: airdrop?.is_featured ?? false,
  })

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      isEdit ? updateAirdrop(airdrop!.id, data) : createAirdrop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-airdrops'] })
      queryClient.invalidateQueries({ queryKey: ['airdrops'] })
      queryClient.invalidateQueries({ queryKey: ['admin-airdrops-stats'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      start_date: form.start_date || undefined,
      deadline: form.deadline || undefined,
    } as typeof form
    mutation.mutate(payload)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Airdrop' : 'Create Airdrop'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" name="name" value={form.name} onChange={handleChange} required />
            <Field label="Project" name="project" value={form.project} onChange={handleChange} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              options={['defi', 'nft', 'gaming', 'layer2', 'other']}
            />
            <SelectField
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={['active', 'upcoming', 'ended']}
            />
            <SelectField
              label="Difficulty"
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              options={['easy', 'medium', 'hard']}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Reward Estimate" name="reward_estimate" value={form.reward_estimate} onChange={handleChange} />
            <Field label="Reward Token" name="reward_token" value={form.reward_token} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <textarea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
            <textarea
              name="steps"
              value={form.steps}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="URL" name="url" value={form.url} onChange={handleChange} type="url" />
            <Field label="Image URL" name="image_url" value={form.image_url} onChange={handleChange} type="url" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start Date" name="start_date" value={form.start_date} onChange={handleChange} type="date" />
            <Field label="Deadline" name="deadline" value={form.deadline} onChange={handleChange} type="date" />
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_verified"
                checked={form.is_verified}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Verified</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">Failed to save. Please try again.</p>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
      />
    </div>
  )
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: string[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
    </div>
  )
}
