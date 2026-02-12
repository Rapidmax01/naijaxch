import api from './api'
import type { NewsFeedResponse } from '../types'

export async function fetchNewsFeed(params?: {
  category?: string
  source?: string
  limit?: number
  offset?: number
}): Promise<NewsFeedResponse> {
  const response = await api.get<NewsFeedResponse>('/news/feed', { params })
  return response.data
}

export async function fetchNewsSources(): Promise<{ sources: string[] }> {
  const response = await api.get('/news/sources')
  return response.data
}
