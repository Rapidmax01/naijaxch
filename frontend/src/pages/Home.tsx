import { Link } from 'react-router-dom'
import { TrendingUp, BarChart3, Bell, Zap, Shield, Users } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Home() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        {isAuthenticated && (
          <p className="text-green-600 font-medium mb-4">
            Welcome back, {user?.email?.split('@')[0]}!
          </p>
        )}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Smart Trading Tools for
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
            {' '}Nigerian Traders
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Find crypto arbitrage opportunities and screen Nigerian stocks with our
          powerful, real-time trading tools.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/arb"
            className="btn btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            {isAuthenticated ? 'Go to ArbScanner' : 'Try ArbScanner Free'}
          </Link>
          {isAuthenticated ? (
            <Link
              to="/ngx"
              className="btn btn-outline text-lg px-8 py-3 flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              Go to NGX Radar
            </Link>
          ) : (
            <Link
              to="/register"
              className="btn btn-outline text-lg px-8 py-3"
            >
              Create Account
            </Link>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section className="grid md:grid-cols-2 gap-8">
        {/* ArbScanner */}
        <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">ArbScanner</h2>
              <p className="text-green-100">Crypto Arbitrage Scanner</p>
            </div>
          </div>
          <p className="text-green-50 mb-6">
            Monitor prices across Binance P2P, Quidax, Luno, and more. Get instant
            alerts when profitable opportunities appear.
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Real-time price monitoring
            </li>
            <li className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Telegram alerts
            </li>
            <li className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Fee-adjusted calculations
            </li>
          </ul>
          <Link
            to="/arb"
            className="block text-center py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition"
          >
            Launch ArbScanner
          </Link>
        </div>

        {/* NGX Radar */}
        <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">NGX Radar</h2>
              <p className="text-blue-100">Nigerian Stock Screener</p>
            </div>
          </div>
          <p className="text-blue-50 mb-6">
            The TradingView for Nigerian stocks. Screen all NGX-listed companies,
            set price alerts, and track your portfolio.
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              All NGX-listed stocks
            </li>
            <li className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Price alerts
            </li>
            <li className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Watchlists & screening
            </li>
          </ul>
          <Link
            to="/ngx"
            className="block text-center py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Launch NGX Radar
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">
          Why Nigerian Traders Trust Us
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-Time Data</h3>
            <p className="text-gray-600">
              Get prices updated every minute from all major Nigerian crypto
              exchanges and P2P platforms.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Alerts</h3>
            <p className="text-gray-600">
              Receive Telegram notifications the moment a profitable arbitrage
              opportunity is detected.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Built for Naija</h3>
            <p className="text-gray-600">
              Designed specifically for Nigerian traders with local exchanges,
              NGN prices, and naira calculations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="card bg-gradient-to-r from-gray-900 to-gray-800 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">
          {isAuthenticated ? 'Upgrade Your Trading' : 'Ready to Start Trading Smarter?'}
        </h2>
        <p className="text-gray-300 mb-6 max-w-xl mx-auto">
          {isAuthenticated
            ? 'Unlock premium features with more alerts, real-time data, and unlimited access.'
            : 'Join thousands of Nigerian traders using NaijaTrade Tools to find profitable opportunities.'}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/pricing"
                className="btn bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-3"
              >
                View Plans
              </Link>
              <Link
                to="/account"
                className="btn bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-3"
              >
                My Account
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="btn bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-3"
              >
                Get Started Free
              </Link>
              <Link
                to="/arb"
                className="btn bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-3"
              >
                View Demo
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
