import { useState } from 'react'
import { Check, X, Zap, BarChart3, Shield, Clock, Users, TrendingUp } from 'lucide-react'
import { usePlans, useSubscription, useInitializePayment } from '../hooks/useSubscription'
import { formatNaira, getBillingDiscount } from '../services/subscriptions'
import { useAuthStore } from '../store/authStore'
import { Link } from 'react-router-dom'

type BillingCycle = 'monthly' | 'quarterly' | 'yearly'
type Product = 'arbscanner' | 'ngxradar'

const PLAN_FEATURES = {
  arbscanner: {
    free: [
      { name: 'USDT arbitrage only', included: true },
      { name: '3 exchanges', included: true },
      { name: '15-min refresh rate', included: true },
      { name: '3 alerts per day', included: true },
      { name: '24-hour history', included: true },
      { name: 'Ad-free experience', included: false },
      { name: 'BTC & ETH pairs', included: false },
      { name: 'All exchanges', included: false },
      { name: 'Real-time refresh', included: false },
    ],
    starter: [
      { name: 'USDT & BTC arbitrage', included: true },
      { name: '5 exchanges', included: true },
      { name: '5-min refresh rate', included: true },
      { name: '20 alerts per day', included: true },
      { name: '7-day history', included: true },
      { name: 'Ad-free experience', included: true },
      { name: 'ETH & other pairs', included: false },
      { name: 'All exchanges', included: false },
      { name: 'Real-time refresh', included: false },
    ],
    pro: [
      { name: 'All crypto pairs', included: true },
      { name: 'All exchanges', included: true },
      { name: '1-min refresh rate', included: true },
      { name: 'Unlimited alerts', included: true },
      { name: '30-day history', included: true },
      { name: 'Ad-free experience', included: true },
      { name: 'Email notifications', included: true },
      { name: 'Telegram alerts', included: true },
      { name: 'Priority support', included: true },
    ],
    business: [
      { name: 'Everything in Pro', included: true },
      { name: 'Real-time WebSocket', included: true },
      { name: 'Unlimited history', included: true },
      { name: 'Ad-free experience', included: true },
      { name: 'API access', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'Team accounts', included: true },
      { name: 'White-label option', included: true },
    ],
  },
  ngxradar: {
    free: [
      { name: '5 watchlist stocks', included: true },
      { name: 'Basic screener', included: true },
      { name: '1-month history', included: true },
      { name: '2 price alerts', included: true },
      { name: 'Ad-free experience', included: false },
      { name: 'Full screener access', included: false },
      { name: 'Portfolio tracking', included: false },
      { name: 'Dividend calendar', included: false },
    ],
    basic: [
      { name: '20 watchlist stocks', included: true },
      { name: 'Full screener access', included: true },
      { name: '12-month history', included: true },
      { name: '10 price alerts', included: true },
      { name: 'Ad-free experience', included: true },
      { name: 'Dividend calendar', included: true },
      { name: 'Portfolio tracking', included: false },
      { name: 'API access', included: false },
    ],
    pro: [
      { name: 'Unlimited watchlist', included: true },
      { name: 'Full screener access', included: true },
      { name: '5-year history', included: true },
      { name: 'Unlimited alerts', included: true },
      { name: 'Ad-free experience', included: true },
      { name: 'Portfolio tracking', included: true },
      { name: 'Dividend calendar', included: true },
      { name: 'Email notifications', included: true },
      { name: 'Priority support', included: true },
    ],
    investor: [
      { name: 'Everything in Pro', included: true },
      { name: '10-year history', included: true },
      { name: 'Ad-free experience', included: true },
      { name: 'API access', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom reports', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'Early access features', included: true },
    ],
  },
}

const PLAN_DESCRIPTIONS = {
  arbscanner: {
    free: 'Get started with basic arbitrage monitoring',
    starter: 'For casual traders looking for opportunities',
    pro: 'For active traders who need real-time data',
    business: 'For trading teams and businesses',
  },
  ngxradar: {
    free: 'Explore the NGX with basic tools',
    basic: 'For regular investors monitoring the market',
    pro: 'For serious investors with portfolios',
    investor: 'For institutional-level analysis',
  },
}

function PricingCard({
  planName,
  prices,
  features,
  description,
  billingCycle,
  isCurrentPlan,
  isPopular,
  onSubscribe,
  isLoading,
}: {
  planName: string
  prices: { monthly: number; quarterly: number; yearly: number }
  features: { name: string; included: boolean }[]
  description: string
  billingCycle: BillingCycle
  isCurrentPlan: boolean
  isPopular?: boolean
  onSubscribe: () => void
  isLoading: boolean
}) {
  const price = prices[billingCycle]
  const monthlyEquivalent =
    billingCycle === 'yearly'
      ? Math.round(price / 12)
      : billingCycle === 'quarterly'
        ? Math.round(price / 3)
        : price

  const isFree = price === 0

  return (
    <div
      className={`relative rounded-2xl border-2 p-6 ${
        isPopular
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            MOST POPULAR
          </span>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            CURRENT PLAN
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold capitalize text-gray-900 dark:text-white">{planName}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>

      <div className="text-center mb-6">
        {isFree ? (
          <div className="text-4xl font-bold text-gray-900 dark:text-white">Free</div>
        ) : (
          <>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {formatNaira(monthlyEquivalent)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              per month
              {billingCycle !== 'monthly' && (
                <span className="block text-xs">
                  Billed {formatNaira(price)}/{billingCycle}
                </span>
              )}
            </div>
            {billingCycle !== 'monthly' && (
              <div className="mt-1">
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Save {getBillingDiscount(billingCycle)}%
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            {feature.included ? (
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            )}
            <span
              className={
                feature.included
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-gray-400 dark:text-gray-500'
              }
            >
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSubscribe}
        disabled={isCurrentPlan || isLoading || isFree}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isCurrentPlan
            ? 'bg-green-100 text-green-700 cursor-default dark:bg-green-900/30 dark:text-green-400'
            : isFree
              ? 'bg-gray-100 text-gray-500 cursor-default dark:bg-gray-700 dark:text-gray-400'
              : isPopular
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
        }`}
      >
        {isLoading ? (
          'Processing...'
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : isFree ? (
          'Free Forever'
        ) : (
          'Upgrade Now'
        )}
      </button>
    </div>
  )
}

export default function Pricing() {
  const [selectedProduct, setSelectedProduct] = useState<Product>('arbscanner')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const { isAuthenticated } = useAuthStore()

  const { data: plansData, isLoading: plansLoading } = usePlans(selectedProduct)
  const { data: subscription } = useSubscription(selectedProduct)
  const initPayment = useInitializePayment()

  const handleSubscribe = (planName: string) => {
    if (!isAuthenticated) {
      window.location.href = '/register?redirect=/pricing'
      return
    }

    initPayment.mutate({
      product: selectedProduct,
      plan: planName,
      billing_cycle: billingCycle,
    })
  }

  const plans = plansData?.plans || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your trading needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Product Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setSelectedProduct('arbscanner')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedProduct === 'arbscanner'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <Zap className="w-5 h-5" />
              ArbScanner
            </button>
            <button
              onClick={() => setSelectedProduct('ngxradar')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedProduct === 'ngxradar'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              NGX Radar
            </button>
          </div>
        </div>

        {/* Billing Cycle Selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                billingCycle === 'quarterly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Quarterly
              <span className="ml-1 text-xs text-green-600 dark:text-green-400">-17%</span>
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs text-green-600 dark:text-green-400">-25%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        {plansLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {plans.map((plan) => {
              const productFeatures = PLAN_FEATURES[selectedProduct] as Record<string, { name: string; included: boolean }[]>
              const productDescriptions = PLAN_DESCRIPTIONS[selectedProduct] as Record<string, string>
              return (
                <PricingCard
                  key={plan.name}
                  planName={plan.name}
                  prices={plan.prices}
                  features={productFeatures[plan.name] || []}
                  description={productDescriptions[plan.name] || ''}
                  billingCycle={billingCycle}
                  isCurrentPlan={subscription?.plan === plan.name}
                  isPopular={plan.name === 'pro'}
                  onSubscribe={() => handleSubscribe(plan.name)}
                  isLoading={initPayment.isPending}
                />
              )
            })}
          </div>
        )}

        {/* Features Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Why Choose Naija Trading Tools?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-Time Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get live prices and opportunities as they happen
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Powered by Paystack for safe Nigerian payments
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Local Support</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nigerian support team ready to help
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Proven Results</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Traders find opportunities daily
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 group">
              <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
                Can I cancel my subscription anytime?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Yes, you can cancel anytime from your account settings. You'll continue to have access until the end of your billing period.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 group">
              <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
                What payment methods do you accept?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                We accept all major Nigerian bank cards, bank transfers, and USSD through Paystack. All payments are in Naira (NGN).
              </p>
            </details>
            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 group">
              <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
                Can I upgrade or downgrade my plan?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at your next billing cycle.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 group">
              <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
                Do you offer refunds?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                We offer a 7-day money-back guarantee for first-time subscribers. If you're not satisfied, contact our support team within 7 days for a full refund.
              </p>
            </details>
          </div>
        </div>

        {/* CTA */}
        {!isAuthenticated && (
          <div className="text-center mt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to start trading smarter?
            </h2>
            <Link
              to="/register"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
