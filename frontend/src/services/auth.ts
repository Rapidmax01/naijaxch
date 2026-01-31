import api from './api'
import type { User, AuthTokens } from '../types'

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  first_name?: string
  last_name?: string
}

export async function login(credentials: LoginRequest): Promise<AuthTokens> {
  const response = await api.post<AuthTokens>('/auth/login', credentials)
  return response.data
}

export async function register(data: RegisterRequest): Promise<User> {
  const response = await api.post<User>('/auth/register', data)
  return response.data
}

export async function getCurrentUser(token?: string): Promise<User> {
  const config = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {}
  const response = await api.get<User>('/auth/me', config)
  return response.data
}

export async function refreshToken(refresh_token: string): Promise<AuthTokens> {
  const response = await api.post<AuthTokens>('/auth/refresh', null, {
    params: { refresh_token },
  })
  return response.data
}
