import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { createSignal, updateSignal } from '../../services/signals'
import type { TradingSignal } from '../../types'

interface Props {
  signal: TradingSignal | null
  onClose: () => void
}

export default function SignalFormModal({ signal, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!signal

  const [form, setForm] = useState({
    asset_type: signal?.asset_type ?? 'crypto',
    asset_symbol: signal?.asset_symbol ?? '',
    direction: signal?.direction ?? 'long',
    entry_price: signal?.entry_price?.toString() ?? '',
    target_price: signal?.target_price?.toString() ?? '',
    stop_loss: signal?.stop_loss?.toString() ?? '',
    reasoning: signal?.reasoning ?? '',
    timeframe: signal?.timeframe ?? '1d',
    is_premium: signal?.is_premium ?? false,
    // Edit-only fields
    status: signal?.status ?? 'open',
    result: signal?.result ?? '',
    result_percent: signal?.result_percent?.toString() ?? '',
  })

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? updateSignal(signal!.id, data) : createSignal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-signals'] })
      queryClient.invalidateQueries({ queryKey: ['signals'] })
      queryClient.invalidateQueries({ queryKey: ['admin-signal-stats'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEdit) {
      const payload: Record<string, unknown> = {
        status: form.status,
        target_price: form.target_price ? parseFloat(form.target_price) : undefined,
        stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : undefined,
        reasoning: form.reasoning || undefined,
        result: form.result || undefined,
        result_percent: form.result_percent ? parseFloat(form.result_percent) : undefined,
      }
      mutation.mutate(payload)
    } else {
      const payload: Record<string, unknown> = {
        asset_type: form.asset_type,
        asset_symbol: form.asset_symbol,
        direction: form.direction,
        entry_price: parseFloat(form.entry_price),
        target_price: form.target_price ? parseFloat(form.target_price) : undefined,
        stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : undefined,
        reasoning: form.reasoning || undefined,
        timeframe: form.timeframe || undefined,
        is_premium: form.is_premium,
      }
      mutation.mutate(payload)
    }
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Signal' : 'Create Signal'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEdit && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                  <select
                    name="asset_type"
                    value={form.asset_type}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
                  >
                    <option value="crypto">Crypto</option>
                    <option value="stock">Stock</option>
                    <option value="forex">Forex</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                  <input
                    type="text"
                    name="asset_symbol"
                    value={form.asset_symbol}
                    onChange={handleChange}
                    required
                    placeholder="BTC, ETH, AAPL..."
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                  <select
                    name="direction"
                    value={form.direction}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    name="entry_price"
                    value={form.entry_price}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Price</label>
              <input
                type="number"
                step="any"
                name="target_price"
                value={form.target_price}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stop Loss</label>
              <input
                type="number"
                step="any"
                name="stop_loss"
                value={form.stop_loss}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reasoning</label>
            <textarea
              name="reasoning"
              value={form.reasoning}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
            />
          </div>

          {!isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
                <select
                  name="timeframe"
                  value={form.timeframe}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
                >
                  <option value="1h">1 Hour</option>
                  <option value="4h">4 Hours</option>
                  <option value="1d">1 Day</option>
                  <option value="1w">1 Week</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_premium"
                    checked={form.is_premium}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Premium Signal</span>
                </label>
              </div>
            </div>
          )}

          {isEdit && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                <select
                  name="result"
                  value={form.result}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
                >
                  <option value="">-</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Result %</label>
                <input
                  type="number"
                  step="any"
                  name="result_percent"
                  value={form.result_percent}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border px-3 py-2"
                />
              </div>
            </div>
          )}

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
