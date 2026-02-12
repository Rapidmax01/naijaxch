import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatNaira } from '../../utils/formatters'

interface DcaChartEntry {
  date: string
  price_per_unit_ngn: number
  amount_ngn: number
}

interface DcaChartProps {
  entries: DcaChartEntry[]
  avgCost: number | null
  currentPrice: number | null
}

export function DcaChart({ entries, avgCost, currentPrice }: DcaChartProps) {
  if (entries.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No entries yet. Log a purchase to see the chart.</p>
      </div>
    )
  }

  const chartData = entries
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
      }),
      price: entry.price_per_unit_ngn,
      amount: entry.amount_ngn,
    }))

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Price History</h3>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              tickFormatter={(value: number) => formatNaira(value)}
              width={100}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatNaira(value),
                name === 'price' ? 'Buy Price' : 'Amount Invested',
              ]}
              labelStyle={{ fontWeight: 600 }}
              contentStyle={{
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value: string) => {
                if (value === 'price') return 'Buy Price'
                return value
              }}
            />

            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: '#2563eb' }}
              activeDot={{ r: 6 }}
              name="price"
            />

            {avgCost !== null && (
              <ReferenceLine
                y={avgCost}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 4"
                label={{
                  value: `Avg Cost: ${formatNaira(avgCost)}`,
                  position: 'insideTopRight',
                  fill: '#d97706',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            )}

            {currentPrice !== null && (
              <ReferenceLine
                y={currentPrice}
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: `Current: ${formatNaira(currentPrice)}`,
                  position: 'insideBottomRight',
                  fill: '#059669',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for reference lines */}
      <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
        {avgCost !== null && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-amber-500" style={{ borderTop: '2px dashed #f59e0b' }} />
            <span>Average Cost</span>
          </div>
        )}
        {currentPrice !== null && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-emerald-500" style={{ borderTop: '2px dashed #10b981' }} />
            <span>Current Price</span>
          </div>
        )}
      </div>
    </div>
  )
}
