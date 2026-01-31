import api from './api'

export interface PlanInfo {
  name: string
  prices: {
    monthly: number
    quarterly: number
    yearly: number
  }
  limits: Record<string, any>
}

export interface PlansResponse {
  product: string
  plans: PlanInfo[]
}

export interface Subscription {
  id: string
  product: string
  plan: string
  status: string
  price_ngn: number | null
  billing_cycle: string | null
  started_at: string | null
  expires_at: string | null
  is_active: boolean
}

export interface UserLimits {
  product: string
  plan: string
  limits: Record<string, any>
}

export interface InitializePaymentRequest {
  product: string
  plan: string
  billing_cycle: 'monthly' | 'quarterly' | 'yearly'
}

export interface InitializePaymentResponse {
  reference: string
  authorization_url: string
  access_code: string
}

export interface PaymentResponse {
  id: string
  amount_ngn: number
  status: string
  reference: string
  paid_at: string | null
}

// Get available plans for a product
export async function getPlans(product: string): Promise<PlansResponse> {
  const response = await api.get<PlansResponse>(`/plans/${product}`)
  return response.data
}

// Get user's subscriptions
export async function getMySubscriptions(): Promise<Subscription[]> {
  const response = await api.get<Subscription[]>('/subscriptions')
  return response.data
}

// Get subscription for a specific product
export async function getSubscription(product: string): Promise<Subscription> {
  const response = await api.get<Subscription>(`/subscriptions/${product}`)
  return response.data
}

// Get user's plan limits for a product
export async function getMyLimits(product: string): Promise<UserLimits> {
  const response = await api.get<UserLimits>(`/subscriptions/${product}/limits`)
  return response.data
}

// Initialize a payment
export async function initializePayment(
  data: InitializePaymentRequest
): Promise<InitializePaymentResponse> {
  const response = await api.post<InitializePaymentResponse>('/payments/initialize', data)
  return response.data
}

// Verify a payment
export async function verifyPayment(reference: string): Promise<PaymentResponse> {
  const response = await api.post<PaymentResponse>('/payments/verify', { reference })
  return response.data
}

// Cancel a subscription
export async function cancelSubscription(product: string): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(`/subscriptions/${product}/cancel`)
  return response.data
}

// Format price in Naira
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Get billing cycle discount percentage
export function getBillingDiscount(cycle: string): number {
  switch (cycle) {
    case 'quarterly':
      return 17 // ~17% discount
    case 'yearly':
      return 25 // 25% discount
    default:
      return 0
  }
}
