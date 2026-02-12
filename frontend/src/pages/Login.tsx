import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { login, getCurrentUser, googleAuth } from '../services/auth'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const googleButtonRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleResponse = async (response: { credential: string }) => {
    setError('')
    setIsLoading(true)
    try {
      const tokens = await googleAuth(response.credential)
      const user = await getCurrentUser(tokens.access_token)
      setAuth(user, tokens)
      navigate('/arb')
    } catch (err: unknown) {
      let errorMessage = 'Google sign-in failed. Please try again.'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } }
        if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail
        }
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      })
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleButtonRef.current.offsetWidth,
        text: 'signin_with',
      })
    }

    if (window.google?.accounts?.id) {
      initGoogle()
    } else {
      // GSI script still loading — wait for it
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          initGoogle()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const tokens = await login({ email, password })
      const user = await getCurrentUser(tokens.access_token)
      setAuth(user, tokens)
      navigate('/arb')
    } catch (err: unknown) {
      let errorMessage = 'Login failed. Please check your credentials.'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string }, status?: number } }
        if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail
        } else if (axiosError.response?.status === 401) {
          errorMessage = 'Incorrect email or password'
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'Request blocked. Try disabling ad blockers or using incognito mode.'
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            <div ref={googleButtonRef} className="flex justify-center" />
          </>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
