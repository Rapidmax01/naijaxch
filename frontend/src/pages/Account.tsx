import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, CreditCard, Bell, Shield, LogOut, ChevronRight, Zap, BarChart3, MessageCircle, Copy, Check, ExternalLink } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useMySubscriptions, useCancelSubscription } from '../hooks/useSubscription'
import { useTelegramStatus, useTelegramLinkToken, useUnlinkTelegram, useTestTelegram } from '../hooks/useTelegram'
import { formatNaira } from '../services/subscriptions'

function SubscriptionCard({
  subscription,
  onCancel,
  isCancelling,
}: {
  subscription: {
    id: string
    product: string
    plan: string
    status: string
    price_ngn: number | null
    billing_cycle: string | null
    expires_at: string | null
    is_active: boolean
  }
  onCancel: () => void
  isCancelling: boolean
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const productIcons = {
    arbscanner: Zap,
    ngxradar: BarChart3,
  }

  const Icon = productIcons[subscription.product as keyof typeof productIcons] || Zap

  const isPaid = subscription.plan !== 'free'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
              {subscription.product === 'arbscanner' ? 'ArbScanner' : 'NGX Radar'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="capitalize">{subscription.plan}</span> Plan
              {subscription.status === 'cancelled' && (
                <span className="ml-2 text-orange-600 dark:text-orange-400">(Cancelled)</span>
              )}
            </p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            subscription.is_active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          {subscription.is_active ? 'Active' : 'Inactive'}
        </div>
      </div>

      {isPaid && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Price</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {subscription.price_ngn ? formatNaira(subscription.price_ngn) : 'Free'}
                {subscription.billing_cycle && (
                  <span className="text-gray-500 dark:text-gray-400">
                    /{subscription.billing_cycle}
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                {subscription.status === 'cancelled' ? 'Access Until' : 'Renews On'}
              </span>
              <p className="font-medium text-gray-900 dark:text-white">
                {subscription.expires_at
                  ? new Date(subscription.expires_at).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
        <Link
          to="/pricing"
          className="flex-1 text-center py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {isPaid ? 'Change Plan' : 'Upgrade'}
        </Link>
        {isPaid && subscription.status !== 'cancelled' && (
          <>
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="py-2 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onCancel()
                    setShowCancelConfirm(false)
                  }}
                  disabled={isCancelling}
                  className="py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="py-2 px-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Keep
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TelegramSection() {
  const { data: status, isLoading } = useTelegramStatus()
  const getLinkToken = useTelegramLinkToken()
  const unlinkTelegram = useUnlinkTelegram()
  const testTelegram = useTestTelegram()
  const [copied, setCopied] = useState(false)

  const handleCopyToken = () => {
    if (getLinkToken.data?.token) {
      navigator.clipboard.writeText(getLinkToken.data.token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <section id="notifications">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Telegram Notifications
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : status?.linked ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Telegram Connected</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You'll receive alerts on Telegram
                </p>
              </div>
              <div className="ml-auto">
                <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => testTelegram.mutate()}
                disabled={testTelegram.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {testTelegram.isPending ? 'Sending...' : 'Send Test'}
              </button>
              <button
                onClick={() => unlinkTelegram.mutate()}
                disabled={unlinkTelegram.isPending}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
              >
                {unlinkTelegram.isPending ? 'Unlinking...' : 'Unlink'}
              </button>
            </div>
            {testTelegram.isSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400">Test notification sent!</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Connect Telegram</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get instant alerts for arbitrage opportunities and stock prices
                </p>
              </div>
            </div>

            {getLinkToken.data ? (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  1. Click the button below to open our Telegram bot
                </p>
                <a
                  href={getLinkToken.data.bot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc] text-white rounded-lg font-medium hover:bg-[#0077b5] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Open @naijaxchbot
                  <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  2. Or copy this token and send it to the bot:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded font-mono text-sm">
                    {getLinkToken.data.token}
                  </code>
                  <button
                    onClick={handleCopyToken}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Token expires in {Math.floor(getLinkToken.data.expires_in / 60)} minutes
                </p>
              </div>
            ) : (
              <button
                onClick={() => getLinkToken.mutate()}
                disabled={getLinkToken.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {getLinkToken.isPending ? 'Generating...' : 'Link Telegram'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default function Account() {
  const { user, logout } = useAuthStore()
  const { data: subscriptions, isLoading } = useMySubscriptions()
  const cancelSub = useCancelSubscription()

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  const menuItems = [
    { icon: User, label: 'Profile', href: '#profile' },
    { icon: CreditCard, label: 'Subscriptions', href: '#subscriptions' },
    { icon: Bell, label: 'Notifications', href: '#notifications' },
    { icon: Shield, label: 'Security', href: '#security' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Account Settings</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* User Info */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {user?.email || 'User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Member</p>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <nav className="p-2">
                {menuItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </nav>

              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Profile Section */}
            <section id="profile">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={
                        user?.created_at
                          ? new Date(user.created_at).toLocaleDateString('en-NG', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'N/A'
                      }
                      disabled
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Subscriptions Section */}
            <section id="subscriptions">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Subscriptions
                </h2>
                <Link
                  to="/pricing"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all plans
                </Link>
              </div>

              {isLoading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : subscriptions && subscriptions.length > 0 ? (
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <SubscriptionCard
                      key={sub.id || sub.product}
                      subscription={sub}
                      onCancel={() => cancelSub.mutate(sub.product)}
                      isCancelling={cancelSub.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You don't have any active subscriptions.
                  </p>
                  <Link
                    to="/pricing"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Plans
                  </Link>
                </div>
              )}
            </section>

            {/* Telegram Section */}
            <TelegramSection />

            {/* Quick Links */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Links
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/arb"
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
                >
                  <Zap className="w-6 h-6 text-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">ArbScanner</span>
                </Link>
                <Link
                  to="/ngx"
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
                >
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">NGX Radar</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
