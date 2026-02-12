import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calculator, Trophy, TrendingUp, Clock } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { compareInvestments } from '../services/calculator'
import { formatNaira, formatPercent } from '../utils/formatters'
import type { CalcCompareResponse, CalcResult } from '../types'

const DURATION_PRESETS = [
  { label: '3mo', value: '3mo' },
  { label: '6mo', value: '6mo' },
  { label: '1yr', value: '1yr' },
  { label: '2yr', value: '2yr' },
  { label: '5yr', value: '5yr' },
] as const

const CHART_COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#dc2626', // red-600
  '#9333ea', // purple-600
  '#ea580c', // orange-600
  '#0891b2', // cyan-600
  '#ca8a04', // yellow-600
  '#e11d48', // rose-600
]

function getRiskBadgeClass(risk: string): string {
  switch (risk.toLowerCase()) {
    case 'low':
      return 'bg-green-100 text-green-700'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700'
    case 'high':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function buildChartData(results: CalcResult[]): Record<string, number | string>[] {
  if (results.length === 0) return []

  const maxMonths = Math.max(...results.map((r) => r.growth_curve.length))
  const chartData: Record<string, number | string>[] = []

  for (let i = 0; i < maxMonths; i++) {
    const point: Record<string, number | string> = {
      month: results[0].growth_curve[i]?.month ?? i,
    }
    for (const result of results) {
      const curvePoint = result.growth_curve[i]
      if (curvePoint) {
        point[result.name] = Math.round(curvePoint.value)
      }
    }
    chartData.push(point)
  }

  return chartData
}

export default function SavingsCalculator() {
  const [amountInput, setAmountInput] = useState<string>('1,000,000')
  const [duration, setDuration] = useState<string>('1yr')

  const amountNgn = Number(amountInput.replace(/,/g, '')) || 0

  const { data, isLoading, isError, error } = useQuery<CalcCompareResponse>({
    queryKey: ['savings-calculator', amountNgn, duration],
    queryFn: () => compareInvestments(amountNgn, duration),
    enabled: amountNgn > 0,
  })

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    if (raw === '') {
      setAmountInput('')
      return
    }
    const formatted = Number(raw).toLocaleString('en-NG')
    setAmountInput(formatted)
  }

  const sortedResults = data?.results
    ? [...data.results].sort((a, b) => b.total_return - a.total_return)
    : []

  const chartData = data?.results ? buildChartData(data.results) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calculator className="w-8 h-8 text-blue-600" />
          Savings Calculator
        </h1>
        <p className="text-gray-600 mt-1">
          Compare how your naira grows across different savings and investment instruments
        </p>
      </div>

      {/* Input Controls */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          {/* Amount Input */}
          <div className="flex-1">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                NGN
              </span>
              <input
                id="amount"
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={handleAmountChange}
                className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="1,000,000"
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Duration
            </label>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setDuration(preset.value)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    duration === preset.value
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && amountNgn > 0 && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Calculating returns...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card bg-red-50 border border-red-200">
          <p className="text-red-700 font-medium">Failed to calculate returns</p>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
        </div>
      )}

      {/* Empty Amount */}
      {amountNgn === 0 && !isLoading && (
        <div className="card text-center py-12">
          <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Enter an amount above to compare investment returns</p>
        </div>
      )}

      {/* Results */}
      {data && sortedResults.length > 0 && (
        <>
          {/* Winner Card */}
          {data.winner && (
            <div className="card bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    Best Return: {data.winner.name}
                  </h3>
                  <p className="text-gray-700 mt-1">
                    Investing {formatNaira(data.amount_ngn)} for {data.duration} yields{' '}
                    <span className="font-bold text-green-700">
                      {formatNaira(data.winner.final_value)}
                    </span>{' '}
                    — a return of{' '}
                    <span className="font-bold text-green-700">
                      {formatNaira(data.winner.total_return)}
                    </span>{' '}
                    ({formatPercent(data.winner.return_percent)})
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                    <span>
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      {data.winner.annual_rate.toFixed(1)}% annual rate
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskBadgeClass(data.winner.risk)}`}>
                      {data.winner.risk} risk
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Growth Chart */}
          {chartData.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Over Time</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(month: number) =>
                        month >= 12 ? `${(month / 12).toFixed(0)}yr` : `${month}mo`
                      }
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis
                      tickFormatter={(value: number) => {
                        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
                        if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
                        return value.toString()
                      }}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatNaira(value)}
                      labelFormatter={(month: number) =>
                        month >= 12
                          ? `Month ${month} (${(month / 12).toFixed(1)} years)`
                          : `Month ${month}`
                      }
                    />
                    <Legend />
                    {sortedResults.map((result, index) => (
                      <Line
                        key={result.key}
                        type="monotone"
                        dataKey={result.name}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={index === 0 ? 3 : 1.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 pr-4 text-gray-500 font-medium">#</th>
                    <th className="text-left py-3 pr-4 text-gray-500 font-medium">Instrument</th>
                    <th className="text-right py-3 pr-4 text-gray-500 font-medium">Rate</th>
                    <th className="text-right py-3 pr-4 text-gray-500 font-medium">Final Value</th>
                    <th className="text-right py-3 pr-4 text-gray-500 font-medium">Return</th>
                    <th className="text-right py-3 text-gray-500 font-medium">Return %</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((result, index) => (
                    <tr
                      key={result.key}
                      className={`border-b border-gray-100 last:border-0 ${
                        index === 0 ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="py-3 pr-4 text-gray-400 font-mono">
                        {index === 0 ? (
                          <Trophy className="w-4 h-4 text-yellow-500" />
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-gray-900">{result.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">{result.category}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${getRiskBadgeClass(
                              result.risk
                            )}`}
                          >
                            {result.risk}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-700">
                        {result.annual_rate.toFixed(1)}%
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold text-gray-900">
                        {formatNaira(result.final_value)}
                      </td>
                      <td className="py-3 pr-4 text-right text-green-700 font-medium">
                        {formatNaira(result.total_return)}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-semibold ${
                            result.return_percent >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {formatPercent(result.return_percent)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="card bg-gray-50 border border-gray-200">
            <p className="text-gray-500 text-xs">
              <strong>Disclaimer:</strong> These projections are estimates based on current rates and
              historical data. Actual returns may vary. Cryptocurrency and stock investments carry
              risk, including possible loss of principal. This is not financial advice.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
