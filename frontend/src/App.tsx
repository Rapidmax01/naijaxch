import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Pricing from './pages/Pricing'
import PaymentVerify from './pages/PaymentVerify'
import Account from './pages/Account'
import NairaRates from './pages/NairaRates'
import ArbDashboard from './pages/arbscanner/ArbDashboard'
import Calculator from './pages/arbscanner/Calculator'
import Alerts from './pages/arbscanner/Alerts'
import NGXDashboard from './pages/ngxradar/NGXDashboard'
import StockDetail from './pages/ngxradar/StockDetail'
import Screener from './pages/ngxradar/Screener'
import Watchlist from './pages/ngxradar/Watchlist'
import StockAlerts from './pages/ngxradar/StockAlerts'
import P2PComparator from './pages/P2PComparator'
import PortfolioPage from './pages/portfolio/PortfolioPage'
import DefiYields from './pages/DefiYields'
import NewsFeed from './pages/NewsFeed'
import SavingsCalculator from './pages/SavingsCalculator'
import DcaTracker from './pages/dca/DcaTracker'
import Signals from './pages/Signals'
import Airdrops from './pages/Airdrops'
import AdminPanel from './pages/AdminPanel'
import { useAuthStore } from './store/authStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" />
  if (!user?.is_admin) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-500 mt-2">You do not have admin privileges.</p>
      </div>
    )
  }
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="naira" element={<NairaRates />} />
        <Route path="payment/verify" element={<PaymentVerify />} />
        <Route
          path="account"
          element={
            <PrivateRoute>
              <Account />
            </PrivateRoute>
          }
        />

        {/* ArbScanner Routes */}
        <Route path="arb">
          <Route index element={<ArbDashboard />} />
          <Route path="calculator" element={<Calculator />} />
          <Route
            path="alerts"
            element={
              <PrivateRoute>
                <Alerts />
              </PrivateRoute>
            }
          />
        </Route>

        {/* NGX Radar Routes */}
        <Route path="ngx">
          <Route index element={<NGXDashboard />} />
          <Route path="stocks/:symbol" element={<StockDetail />} />
          <Route path="screener" element={<Screener />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="alerts" element={<StockAlerts />} />
        </Route>

        {/* P2P Rate Comparator */}
        <Route path="p2p" element={<P2PComparator />} />

        {/* Crypto Portfolio Tracker (Auth required) */}
        <Route
          path="portfolio"
          element={
            <PrivateRoute>
              <PortfolioPage />
            </PrivateRoute>
          }
        />

        {/* DeFi Yield Finder */}
        <Route path="defi" element={<DefiYields />} />

        {/* News Feed */}
        <Route path="news" element={<NewsFeed />} />

        {/* Savings Calculator */}
        <Route path="calculator" element={<SavingsCalculator />} />

        {/* DCA Tracker (Auth required) */}
        <Route
          path="dca"
          element={
            <PrivateRoute>
              <DcaTracker />
            </PrivateRoute>
          }
        />

        {/* Trading Signals */}
        <Route path="signals" element={<Signals />} />

        {/* Airdrop Tracker */}
        <Route path="airdrops" element={<Airdrops />} />

        {/* Admin Panel */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
