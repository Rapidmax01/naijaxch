import { useState } from 'react'
import { X } from 'lucide-react'

interface AddHoldingData {
  crypto: string
  amount: number
  buy_price_ngn: number
  notes?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddHoldingData) => void
}

const CRYPTO_OPTIONS = ['USDT', 'BTC', 'ETH']

export function AddHoldingModal({ isOpen, onClose, onSubmit }: Props) {
  const [crypto, setCrypto] = useState('USDT')
  const [amount, setAmount] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    const parsedPrice = parseFloat(buyPrice)

    if (isNaN(parsedAmount) || parsedAmount <= 0) return
    if (isNaN(parsedPrice) || parsedPrice <= 0) return

    onSubmit({
      crypto,
      amount: parsedAmount,
      buy_price_ngn: parsedPrice,
      notes: notes.trim() || undefined,
    })

    // Reset form
    setCrypto('USDT')
    setAmount('')
    setBuyPrice('')
    setNotes('')
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add Holding</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Crypto Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cryptocurrency
            </label>
            <select
              value={crypto}
              onChange={(e) => setCrypto(e.target.value)}
              className="input w-full"
            >
              {CRYPTO_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 0.5"
              className="input w-full"
              required
            />
          </div>

          {/* Buy Price NGN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buy Price (NGN)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="e.g. 1650000"
              className="input w-full"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bought on Quidax during dip"
              rows={3}
              className="input w-full resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              Add Holding
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
