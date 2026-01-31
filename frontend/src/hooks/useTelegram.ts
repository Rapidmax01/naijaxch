import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

interface TelegramStatus {
  linked: boolean
  chat_id: number | null
}

interface TelegramLinkToken {
  token: string
  expires_in: number
  bot_url: string
  instructions: string
}

export function useTelegramStatus() {
  return useQuery<TelegramStatus>({
    queryKey: ['telegram', 'status'],
    queryFn: async () => {
      const response = await api.get('/telegram/status')
      return response.data
    },
  })
}

export function useTelegramLinkToken() {
  return useMutation<TelegramLinkToken>({
    mutationFn: async () => {
      const response = await api.get('/telegram/link-token')
      return response.data
    },
  })
}

export function useUnlinkTelegram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete('/telegram/unlink')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'status'] })
    },
  })
}

export function useTestTelegram() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/telegram/test')
      return response.data
    },
  })
}
