import { useEffect, useRef } from 'react'
import { useMySubscriptions } from '../../hooks/useSubscription'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

interface AdBannerProps {
  adSlot: string
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle'
  className?: string
}

export function AdBanner({ adSlot, adFormat = 'auto', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  const adsEnabled = import.meta.env.VITE_ADSENSE_ENABLED === 'true'
  const publisherId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined

  const { data: subscriptions } = useMySubscriptions()

  // Check if user has any paid plan
  const hasPaidPlan = subscriptions?.some(
    (sub: { plan: string; status: string }) => sub.plan !== 'free' && sub.status === 'active'
  )

  useEffect(() => {
    if (!adsEnabled || !publisherId || hasPaidPlan || pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // ad blocker or adsbygoogle not loaded
    }
  }, [adsEnabled, publisherId, hasPaidPlan])

  if (!adsEnabled || !publisherId || hasPaidPlan) return null

  return (
    <div className={`ad-banner overflow-hidden text-center ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  )
}
