import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calculator as CalcIcon, ArrowRight, Loader2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { calculateArbitrage, fetchExchanges } from '../../services/arbscanner'
import { formatNaira, formatPercent } from '../../utils/formatters'
import { getExchangeDisplayName } from '../../utils/exchanges'
import type { CalculateResponse } from '../../types'

export default function Calculator() {
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState({
    buy_exchange: searchParams.get('buy') || 'binance_p2p',
    sell_exchange: searchParams.get('sell') || 'quidax',
    crypto: searchParams.get('crypto') || 'USDT',
    trade_amount_ngn: Number(searchParams.get('amount')) || 100000,
  })

  const [result, setResult] = useState<CalculateResponse | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const { data: exchangesData } = useQuery({
    queryKey: ['exchanges'],
    queryFn: fetchExchanges,
  })

  const calculateMutation = useMutation({
    mutationFn: calculateArbitrage,
    onSuccess: (data) => setResult(data),
  })

  // Auto-calculate with debounce when form changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (formData.buy_exchange && formData.sell_exchange && formData.trade_amount_ngn >= 1000) {
        calculateMutation.mutate(formData)
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [formData.buy_exchange, formData.sell_exchange, formData.crypto, formData.trade_amount_ngn])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    calculateMutation.mutate(formData)
  }

  const exchanges = exchangesData?.exchanges || []
  const cryptos = exchangesData?.cryptos || ['USDT', 'BTC', 'ETH']

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Arbitrage Calculator</h1>
        <p className="text-gray-600">
          Calculate exact profit including all fees for your arbitrage trade
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalcIcon className="w-5 h-5" />
            Trade Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cryptocurrency
              </label>
              <select
                value={formData.crypto}
                onChange={(e) => setFormData({ ...formData, crypto: e.target.value })}
                className="input"
              >
                {cryptos.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buy Exchange
              </label>
              <select
                value={formData.buy_exchange}
                onChange={(e) => setFormData({ ...formData, buy_exchange: e.target.value })}
                className="input"
              >
                {exchanges.map((ex) => (
                  <option key={ex.name} value={ex.name}>
                    {ex.display_name} ({ex.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sell Exchange
              </label>
              <select
                value={formData.sell_exchange}
                onChange={(e) => setFormData({ ...formData, sell_exchange: e.target.value })}
                className="input"
              >
                {exchanges.map((ex) => (
                  <option key={ex.name} value={ex.name}>
                    {ex.display_name} ({ex.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade Amount (NGN)
              </label>
              <input
                type="number"
                value={formData.trade_amount_ngn}
                onChange={(e) => setFormData({ ...formData, trade_amount_ngn: Number(e.target.value) })}
                className="input"
                min={1000}
                step={1000}
              />
            </div>

            <button
              type="submit"
              disabled={calculateMutation.isPending}
              className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {calculateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <CalcIcon className="w-5 h-5" />
                  Calculate Profit
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Results</h2>

          {!result && !calculateMutation.isPending && (
            <div className="text-center py-12 text-gray-500">
              <CalcIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Enter trade details and click calculate to see results</p>
            </div>
          )}

          {calculateMutation.isError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
              Failed to calculate. Please check your inputs and try again.
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Trade flow */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Buy on</p>
                  <p className="font-semibold">{getExchangeDisplayName(result.buy_exchange)}</p>
                  <p className="text-green-600 font-bold">{formatNaira(result.buy_price)}</p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Sell on</p>
                  <p className="font-semibold">{getExchangeDisplayName(result.sell_exchange)}</p>
                  <p className="text-blue-600 font-bold">{formatNaira(result.sell_price)}</p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trade Amount</span>
                  <span className="font-medium">{formatNaira(result.trade_amount_ngn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{result.crypto} Amount</span>
                  <span className="font-medium">{result.crypto_amount.toFixed(4)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Spread</span>
                  <span className="font-medium">
                    {formatNaira(result.gross_spread)} ({formatPercent(result.gross_spread_percent)})
                  </span>
                </div>
                <hr />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Buy Trading Fee</span>
                  <span>{formatNaira(result.fees.buy_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sell Trading Fee</span>
                  <span>{formatNaira(result.fees.sell_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Withdrawal Fee</span>
                  <span>{formatNaira(result.fees.withdrawal_fee)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Fees</span>
                  <span className="text-red-600">-{formatNaira(result.fees.total)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Net Profit</span>
                  <span className={`font-bold ${result.is_profitable ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNaira(result.net_profit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ROI</span>
                  <span className={`font-bold ${result.is_profitable ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(result.roi)}
                  </span>
                </div>
              </div>

              {/* Verdict */}
              <div className={`p-4 rounded-lg ${
                result.is_profitable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-semibold ${result.is_profitable ? 'text-green-700' : 'text-red-700'}`}>
                  {result.is_profitable
                    ? 'This trade is profitable!'
                    : 'This trade would result in a loss'}
                </p>
                <p className={`text-sm ${result.is_profitable ? 'text-green-600' : 'text-red-600'}`}>
                  {result.is_profitable
                    ? `You would make ${formatNaira(result.net_profit)} on this trade.`
                    : 'Fees exceed the spread. Try a different exchange pair or wait for better prices.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
