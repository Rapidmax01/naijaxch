import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface AllocationItem {
  crypto: string
  value: number
  percent: number
}

interface Props {
  allocation: AllocationItem[]
}

const COLORS = [
  '#2563eb', // blue-600
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#10b981', // emerald-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
]

interface CustomTooltipProps {
  active?: boolean
  payload?: { payload: AllocationItem }[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload

  return (
    <div className="bg-white shadow-lg rounded-lg px-3 py-2 border text-sm">
      <p className="font-semibold text-gray-900">{data.crypto}</p>
      <p className="text-gray-600">{data.percent.toFixed(1)}%</p>
    </div>
  )
}

export function PortfolioChart({ allocation }: Props) {
  if (allocation.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No allocation data to display.
      </p>
    )
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Pie Chart */}
      <div className="w-full md:w-1/2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={allocation}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              nameKey="crypto"
              paddingAngle={2}
              stroke="none"
            >
              {allocation.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="w-full md:w-1/2 space-y-2">
        {allocation.map((item, index) => (
          <div key={item.crypto} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium text-gray-900">
                {item.crypto}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {item.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
