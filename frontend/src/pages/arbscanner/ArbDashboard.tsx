import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calculator, Bell, Settings } from 'lucide-react'
import { PriceGrid } from '../../components/arbscanner/PriceGrid'
import { OpportunityList } from '../../components/arbscanner/OpportunityList'
import { AdBanner } from '../../components/common/AdBanner'
import type { ArbitrageOpportunity } from '../../types'

const CRYPTOS = ['USDT', 'BTC', 'ETH']

export default function ArbDashboard() {
  const navigate = useNavigate()
  const [selectedCrypto, setSelectedCrypto] = useState('USDT')
  const [minSpread, setMinSpread] = useState(0.5)
  const [tradeAmount, setTradeAmount] = useState(100000)

  const handleCalculate = (opp: ArbitrageOpportunity) => {
    navigate(`/arb/calculator?buy=${opp.buy_exchange}&sell=${opp.sell_exchange}&crypto=${opp.crypto}&amount=${tradeAmount}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ArbScanner</h1>
          <p className="text-gray-600">
            Find profitable crypto arbitrage opportunities across Nigerian exchanges
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/arb/calculator"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Calculator
          </Link>
          <Link
            to="/arb/alerts"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Alerts
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          {/* Crypto selector */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Cryptocurrency</label>
            <div className="flex rounded-lg border overflow-hidden">
              {CRYPTOS.map((crypto) => (
                <button
                  key={crypto}
                  onClick={() => setSelectedCrypto(crypto)}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    selectedCrypto === crypto
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {crypto}
                </button>
              ))}
            </div>
          </div>

          {/* Min spread */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Min Spread %</label>
            <select
              value={minSpread}
              onChange={(e) => setMinSpread(Number(e.target.value))}
              className="input py-2"
            >
              <option value={0}>Any</option>
              <option value={0.5}>0.5%</option>
              <option value={1}>1%</option>
              <option value={1.5}>1.5%</option>
              <option value={2}>2%</option>
            </select>
          </div>

          {/* Trade amount */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Trade Amount (NGN)</label>
            <select
              value={tradeAmount}
              onChange={(e) => setTradeAmount(Number(e.target.value))}
              className="input py-2"
            >
              <option value={50000}>50,000</option>
              <option value={100000}>100,000</option>
              <option value={250000}>250,000</option>
              <option value={500000}>500,000</option>
              <option value={1000000}>1,000,000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Prices */}
        <PriceGrid crypto={selectedCrypto} />

        {/* Opportunities */}
        <OpportunityList
          crypto={selectedCrypto}
          minSpread={minSpread}
          tradeAmount={tradeAmount}
          onCalculate={handleCalculate}
        />
      </div>

      {/* Info box */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">How Arbitrage Works</h3>
            <p className="text-blue-800 text-sm mt-1">
              Buy crypto on one exchange at a lower price and sell on another at a
              higher price. The profit is the difference minus fees. Always verify
              liquidity and account for transfer times before trading.
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard ad */}
      <AdBanner adSlot="ARB_DASHBOARD_SLOT" adFormat="horizontal" />
    </div>
  )
}
