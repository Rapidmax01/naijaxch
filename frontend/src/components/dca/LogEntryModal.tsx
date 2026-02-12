import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface LogEntryData {
  date: string
  amount_ngn: number
  price_per_unit_ngn: number
  crypto_amount: number
  exchange?: string
  notes?: string
}

interface LogEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LogEntryData) => void
  crypto: string
}

function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export function LogEntryModal({ isOpen, onClose, onSubmit, crypto }: LogEntryModalProps) {
  const [date, setDate] = useState(getTodayString())
  const [amountNgn, setAmountNgn] = useState<string>('')
  const [pricePerUnit, setPricePerUnit] = useState<string>('')
  const [cryptoAmount, setCryptoAmount] = useState<string>('')
  const [exchange, setExchange] = useState('')
  const [notes, setNotes] = useState('')

  // Auto-calculate crypto amount when amount and price change
  useEffect(() => {
    const amount = parseFloat(amountNgn)
    const price = parseFloat(pricePerUnit)
    if (!isNaN(amount) && !isNaN(price) && price > 0) {
      setCryptoAmount((amount / price).toFixed(8))
    } else {
      setCryptoAmount('')
    }
  }, [amountNgn, pricePerUnit])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDate(getTodayString())
      setAmountNgn('')
      setPricePerUnit('')
      setCryptoAmount('')
      setExchange('')
      setNotes('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(amountNgn)
    const price = parseFloat(pricePerUnit)
    const cryptoAmt = parseFloat(cryptoAmount)

    if (isNaN(amount) || isNaN(price) || isNaN(cryptoAmt)) return

    onSubmit({
      date,
      amount_ngn: amount,
      price_per_unit_ngn: price,
      crypto_amount: cryptoAmt,
      exchange: exchange.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Log {crypto} Purchase
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          {/* Amount NGN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (NGN)
            </label>
            <input
              type="number"
              value={amountNgn}
              onChange={(e) => setAmountNgn(e.target.value)}
              className="input w-full"
              placeholder="e.g. 50000"
              min={0}
              step="any"
              required
            />
          </div>

          {/* Price per unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per {crypto} (NGN)
            </label>
            <input
              type="number"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              className="input w-full"
              placeholder="e.g. 1650"
              min={0}
              step="any"
              required
            />
          </div>

          {/* Crypto amount (auto-calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {crypto} Amount
              <span className="text-gray-400 font-normal ml-2">(auto-calculated)</span>
            </label>
            <input
              type="number"
              value={cryptoAmount}
              onChange={(e) => setCryptoAmount(e.target.value)}
              className="input w-full bg-gray-50"
              placeholder="Calculated from amount / price"
              min={0}
              step="any"
              readOnly
            />
          </div>

          {/* Exchange (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exchange
              <span className="text-gray-400 font-normal ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="input w-full"
              placeholder="e.g. Bybit, Luno, Quidax"
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
              <span className="text-gray-400 font-normal ml-2">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input w-full resize-none"
              rows={3}
              placeholder="Any notes about this purchase..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!amountNgn || !pricePerUnit || !cryptoAmount}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Log Purchase
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
