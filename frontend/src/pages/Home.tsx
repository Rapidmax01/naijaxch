import { Link } from 'react-router-dom'
import { TrendingUp, BarChart3, Bell, Zap, Users, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { getExchangeReferralUrl } from '../utils/exchanges'
import { AdBanner } from '../components/common/AdBanner'

function LiveSpread() {
  const { data } = useQuery({
    queryKey: ['home-prices'],
    queryFn: async () => {
      const res = await api.get('/arb/opportunities')
      return res.data
    },
    refetchInterval: 60000,
  })

  const bestOpportunity = data?.opportunities?.[0]

  if (!bestOpportunity) return null

  return (
    <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium animate-pulse">
      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
      Live: {bestOpportunity.gross_spread_percent?.toFixed(1)}% spread detected
    </div>
  )
}

export default function Home() {
  const { isAuthenticated, user } = useAuthStore()

  const exchanges = [
    { name: 'Luno', type: 'Exchange', key: 'luno' },
    { name: 'Bybit P2P', type: 'P2P', key: 'bybit_p2p' },
    { name: 'Binance P2P', type: 'P2P', key: 'binance_p2p' },
    { name: 'Quidax', type: 'Exchange', key: 'quidax' },
    { name: 'Remitano', type: 'P2P', key: 'remitano' },
    { name: 'Patricia', type: 'Exchange', key: 'patricia' },
  ]

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center py-16">
        {isAuthenticated ? (
          <p className="text-green-600 dark:text-green-400 font-medium mb-4">
            Welcome back, {user?.email?.split('@')[0]}!
          </p>
        ) : (
          <div className="mb-6">
            <LiveSpread />
          </div>
        )}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Find Crypto Arbitrage
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
            Opportunities in Nigeria
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Compare prices across 7+ Nigerian exchanges instantly. Get alerts when spreads appear.
          Trade smarter with real-time arbitrage detection.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link
            to="/arb"
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
          >
            <TrendingUp className="w-5 h-5" />
            {isAuthenticated ? 'Open ArbScanner' : 'Try Free Now'}
            <ArrowRight className="w-5 h-5" />
          </Link>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-lg px-8 py-4 rounded-xl font-semibold transition-all"
            >
              Create Free Account
            </Link>
          )}
        </div>

        {/* Exchange Logos */}
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Monitoring prices from</p>
          <div className="flex flex-wrap justify-center gap-4">
            {exchanges.map((ex) => {
              const url = getExchangeReferralUrl(ex.key)
              const pill = (
                <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {ex.name}
                </div>
              )
              return url ? (
                <a key={ex.name} href={url} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform">
                  {pill}
                </a>
              ) : (
                <div key={ex.name}>{pill}</div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 dark:bg-gray-800/50 -mx-4 px-4 py-16 rounded-3xl">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">1</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">We Scan Exchanges</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our system checks prices on Luno, Bybit P2P, Binance P2P, and more every minute.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">2</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Find Price Gaps</h3>
              <p className="text-gray-600 dark:text-gray-400">
                When USDT is cheaper on one exchange, we calculate the exact profit opportunity.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-2">3</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Alert You Instantly</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get Telegram notifications the moment a profitable spread appears.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ad between sections */}
      <AdBanner adSlot="HOME_MID_SLOT" adFormat="horizontal" className="my-4" />

      {/* Products Section */}
      <section className="grid md:grid-cols-2 gap-8">
        {/* ArbScanner */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">ArbScanner</h2>
              <p className="text-green-100">Crypto Arbitrage Scanner</p>
            </div>
          </div>
          <p className="text-green-50 mb-6">
            Monitor USDT, BTC, and ETH prices across Nigerian exchanges.
            See real spreads with fee calculations included.
          </p>
          <ul className="space-y-3 mb-6">
            {[
              'Real-time price comparison',
              'Telegram alerts for big spreads',
              'Fee-adjusted profit calculations',
              'Historical spread tracking',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-200" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/arb"
            className="block text-center py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition"
          >
            Launch ArbScanner →
          </Link>
        </div>

        {/* NGX Radar */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">NGX Radar</h2>
              <p className="text-blue-100">Nigerian Stock Screener</p>
            </div>
          </div>
          <p className="text-blue-50 mb-6">
            The only stock screener built for the Nigerian Stock Exchange.
            Track all listed companies with price alerts.
          </p>
          <ul className="space-y-3 mb-6">
            {[
              'All NGX-listed stocks',
              'Custom price alerts',
              'Watchlist management',
              'Dividend tracking',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-200" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/ngx"
            className="block text-center py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
          >
            Launch NGX Radar →
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Built for Nigerian Traders
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          We understand the Nigerian market. That's why we built tools specifically for you.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Real-Time Data</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Prices update every minute from Luno, Bybit, Binance P2P, and local exchanges.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Telegram Alerts</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get notified instantly on Telegram when profitable opportunities appear.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Naira Focused</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All prices in NGN. All calculations in Naira. Built specifically for Nigeria.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white text-center rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">
          {isAuthenticated ? 'Upgrade Your Trading' : 'Start Finding Opportunities Today'}
        </h2>
        <p className="text-gray-300 mb-8 max-w-xl mx-auto">
          {isAuthenticated
            ? 'Unlock premium features with unlimited alerts and real-time data.'
            : 'Join Nigerian traders using NaijaXch to find profitable arbitrage opportunities.'}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-4 rounded-xl font-semibold transition-all"
              >
                View Plans
              </Link>
              <Link
                to="/account"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-4 rounded-xl font-semibold transition-all"
              >
                My Account
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-4 rounded-xl font-semibold transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/arb"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-4 rounded-xl font-semibold transition-all"
              >
                View Live Prices
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Footer Note */}
      <section className="text-center text-gray-500 dark:text-gray-400 text-sm pb-8">
        <p>© 2024 NaijaXch. Built for Nigerian traders.</p>
      </section>
    </div>
  )
}
