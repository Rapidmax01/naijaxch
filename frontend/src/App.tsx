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
import { useAuthStore } from './store/authStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
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
      </Route>
    </Routes>
  )
}

export default App
