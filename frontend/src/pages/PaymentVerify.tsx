import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useVerifyPayment } from '../hooks/useSubscription'
import { formatNaira } from '../services/subscriptions'

export default function PaymentVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const reference = searchParams.get('reference')
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number
    reference: string
  } | null>(null)

  const verifyPayment = useVerifyPayment()

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      return
    }

    verifyPayment.mutate(reference, {
      onSuccess: (data) => {
        setStatus('success')
        setPaymentDetails({
          amount: data.amount_ngn,
          reference: data.reference,
        })
      },
      onError: () => {
        setStatus('failed')
      },
    })
  }, [reference])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {status === 'verifying' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying Payment
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we confirm your payment...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your subscription has been activated.
            </p>

            {paymentDetails && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500 dark:text-gray-400">Amount Paid</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNaira(paymentDetails.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Reference</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {paymentDetails.reference}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Link
                to="/dashboard"
                className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/pricing"
                className="block w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                View Plans
              </Link>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't verify your payment. This could be because the payment was cancelled or there was an error.
            </p>

            <div className="space-y-3">
              <Link
                to="/pricing"
                className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </Link>
              <button
                onClick={() => navigate(-1)}
                className="block w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Go Back
              </button>
            </div>

            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              If you believe this is an error, please contact support with reference:{' '}
              <span className="font-mono">{reference || 'N/A'}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
