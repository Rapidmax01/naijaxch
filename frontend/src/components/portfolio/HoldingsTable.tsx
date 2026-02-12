import { Trash2 } from 'lucide-react'
import { formatNaira, formatPercent } from '../../utils/formatters'
import type { PortfolioHolding } from '../../types'

interface Props {
  holdings: PortfolioHolding[]
  onDelete: (id: string) => void
}

export function HoldingsTable({ holdings, onDelete }: Props) {
  if (holdings.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">No holdings to display.</p>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-sm text-gray-500">
              <th className="pb-3 font-medium">Crypto</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Buy Price</th>
              <th className="pb-3 font-medium">Current Price</th>
              <th className="pb-3 font-medium">Value</th>
              <th className="pb-3 font-medium">P&L</th>
              <th className="pb-3 font-medium">P&L %</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {holdings.map((holding) => {
              const pnl = holding.pnl_ngn ?? 0
              const pnlPercent = holding.pnl_percent ?? 0
              const isProfitable = pnl >= 0

              return (
                <tr key={holding.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <span className="font-semibold text-gray-900">
                      {holding.crypto}
                    </span>
                  </td>
                  <td className="py-3 text-gray-700">
                    {holding.amount}
                  </td>
                  <td className="py-3 text-gray-700">
                    {formatNaira(holding.buy_price_ngn)}
                  </td>
                  <td className="py-3 text-gray-700">
                    {holding.current_price_ngn != null
                      ? formatNaira(holding.current_price_ngn)
                      : '--'}
                  </td>
                  <td className="py-3 text-gray-700">
                    {holding.current_value_ngn != null
                      ? formatNaira(holding.current_value_ngn)
                      : '--'}
                  </td>
                  <td className={`py-3 font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNaira(pnl)}
                  </td>
                  <td className={`py-3 font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(pnlPercent)}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => onDelete(holding.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete holding"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {holdings.map((holding) => {
          const pnl = holding.pnl_ngn ?? 0
          const pnlPercent = holding.pnl_percent ?? 0
          const isProfitable = pnl >= 0

          return (
            <div
              key={holding.id}
              className="border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-lg">
                  {holding.crypto}
                </span>
                <button
                  onClick={() => onDelete(holding.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete holding"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-medium text-gray-900">{holding.amount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Buy Price</p>
                  <p className="font-medium text-gray-900">
                    {formatNaira(holding.buy_price_ngn)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Current Price</p>
                  <p className="font-medium text-gray-900">
                    {holding.current_price_ngn != null
                      ? formatNaira(holding.current_price_ngn)
                      : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Value</p>
                  <p className="font-medium text-gray-900">
                    {holding.current_value_ngn != null
                      ? formatNaira(holding.current_value_ngn)
                      : '--'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-xs text-gray-500">P&L</p>
                  <p className={`font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNaira(pnl)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">P&L %</p>
                  <p className={`font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(pnlPercent)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
