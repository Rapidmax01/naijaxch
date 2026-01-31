import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPlans,
  getMySubscriptions,
  getSubscription,
  getMyLimits,
  initializePayment,
  verifyPayment,
  cancelSubscription,
  InitializePaymentRequest,
} from '../services/subscriptions'

// Get available plans for a product
export function usePlans(product: string) {
  return useQuery({
    queryKey: ['plans', product],
    queryFn: () => getPlans(product),
    staleTime: 1000 * 60 * 60, // 1 hour - plans don't change often
  })
}

// Get all user subscriptions
export function useMySubscriptions() {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: getMySubscriptions,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get subscription for a specific product
export function useSubscription(product: string) {
  return useQuery({
    queryKey: ['subscription', product],
    queryFn: () => getSubscription(product),
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get user's plan limits
export function useMyLimits(product: string) {
  return useQuery({
    queryKey: ['limits', product],
    queryFn: () => getMyLimits(product),
    staleTime: 1000 * 60, // 1 minute
  })
}

// Initialize payment mutation
export function useInitializePayment() {
  return useMutation({
    mutationFn: (data: InitializePaymentRequest) => initializePayment(data),
    onSuccess: (data) => {
      // Redirect to Paystack checkout
      window.location.href = data.authorization_url
    },
  })
}

// Verify payment mutation
export function useVerifyPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reference: string) => verifyPayment(reference),
    onSuccess: () => {
      // Invalidate subscription queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['limits'] })
    },
  })
}

// Cancel subscription mutation
export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (product: string) => cancelSubscription(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
  })
}

// Helper hook to check if user has a specific plan or higher
export function useHasPlan(product: string, requiredPlans: string[]) {
  const { data: subscription, isLoading } = useSubscription(product)

  if (isLoading || !subscription) {
    return { hasPlan: false, isLoading }
  }

  return {
    hasPlan: requiredPlans.includes(subscription.plan),
    isLoading,
    currentPlan: subscription.plan,
  }
}

// Helper hook to check a specific limit
export function useCheckLimit(product: string, limitKey: string) {
  const { data: limits, isLoading } = useMyLimits(product)

  if (isLoading || !limits) {
    return { limit: null, isLoading, isUnlimited: false }
  }

  const limitValue = limits.limits[limitKey]

  return {
    limit: limitValue,
    isLoading,
    isUnlimited: limitValue === -1,
    plan: limits.plan,
  }
}
