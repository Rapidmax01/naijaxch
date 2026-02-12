import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  TrendingUp,
  BarChart3,
  LogOut,
  Menu,
  X,
  CreditCard,
  User,
  DollarSign,
  ArrowLeftRight,
  ChevronDown,
  Briefcase,
  Percent,
  Newspaper,
  Calculator,
  PiggyBank,
  Signal,
  Gift,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { AdBanner } from '../common/AdBanner'
import { InstallPrompt } from '../common/InstallPrompt'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, user, logout } = useAuthStore()
  const location = useLocation()

  const primaryNav: NavItem[] = [
    { name: 'ArbScanner', href: '/arb', icon: TrendingUp },
    { name: 'P2P Rates', href: '/p2p', icon: ArrowLeftRight },
    { name: 'NGX Radar', href: '/ngx', icon: BarChart3 },
    { name: 'Naira Rates', href: '/naira', icon: DollarSign },
  ]

  const moreNav: NavItem[] = [
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { name: 'DeFi Yields', href: '/defi', icon: Percent },
    { name: 'DCA Tracker', href: '/dca', icon: PiggyBank },
    { name: 'News', href: '/news', icon: Newspaper },
    { name: 'Calculator', href: '/calculator', icon: Calculator },
    { name: 'Signals', href: '/signals', icon: Signal },
    { name: 'Airdrops', href: '/airdrops', icon: Gift },
    { name: 'Pricing', href: '/pricing', icon: CreditCard },
  ]

  const isActive = (path: string) => location.pathname.startsWith(path)
  const isMoreActive = moreNav.some((item) => isActive(item.href))

  // Close More dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close More dropdown on route change
  useEffect(() => {
    setMoreMenuOpen(false)
  }, [location.pathname])

  // Mobile nav grouped by category
  const mobileToolsNav: NavItem[] = [
    { name: 'ArbScanner', href: '/arb', icon: TrendingUp },
    { name: 'P2P Rates', href: '/p2p', icon: ArrowLeftRight },
    { name: 'NGX Radar', href: '/ngx', icon: BarChart3 },
    { name: 'Naira Rates', href: '/naira', icon: DollarSign },
    { name: 'Calculator', href: '/calculator', icon: Calculator },
    { name: 'Signals', href: '/signals', icon: Signal },
  ]

  const mobileTrackersNav: NavItem[] = [
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { name: 'DCA Tracker', href: '/dca', icon: PiggyBank },
    { name: 'DeFi Yields', href: '/defi', icon: Percent },
    { name: 'Airdrops', href: '/airdrops', icon: Gift },
  ]

  const mobileInfoNav: NavItem[] = [
    { name: 'News', href: '/news', icon: Newspaper },
    { name: 'Pricing', href: '/pricing', icon: CreditCard },
  ]

  const renderMobileNavSection = (title: string, items: NavItem[]) => (
    <div>
      <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      {items.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            isActive(item.href)
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">NaijaXch</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {primaryNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* More dropdown */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition ${
                    isMoreActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>More</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                    {moreNav.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center space-x-2 px-4 py-2 transition ${
                          isActive(item.href)
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/account"
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user?.email}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="text-gray-600 hover:text-gray-900">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-4 space-y-4">
              {renderMobileNavSection('Trading Tools', mobileToolsNav)}
              {renderMobileNavSection('Trackers', mobileTrackersNav)}
              {renderMobileNavSection('Info', mobileInfoNav)}
              <hr />
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Link
                    to="/account"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Account</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-gray-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 bg-primary-600 text-white rounded-lg text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Leaderboard ad */}
      <AdBanner adSlot="LEADERBOARD_SLOT" adFormat="horizontal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4" />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2024 NaijaXch. All rights reserved.</p>
            <p className="mt-1">Built for Nigerian traders 🇳🇬</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
