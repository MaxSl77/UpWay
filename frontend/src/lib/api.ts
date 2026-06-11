import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach Bearer token ──────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: token refresh on 401 ───────────────────────────
let isRefreshing = false
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void }
let queue: QueueEntry[] = []

const flushQueue = (token: string | null, err: unknown = null) => {
  queue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(err)))
  queue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      // Auth endpoints return 401 as a legitimate failure — don't attempt token refresh
      const url = original.url ?? ''
      if (url.includes('/auth/')) {
        return Promise.reject(error)
      }

      original._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        try {
          const refreshToken = useAuthStore.getState().refreshToken
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
          useAuthStore.getState().setTokens(data.accessToken, data.refreshToken)
          flushQueue(data.accessToken)
        } catch (err) {
          flushQueue(null, err)
          useAuthStore.getState().logout()
          window.location.href = '/login'
        } finally {
          isRefreshing = false
        }
      }

      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          },
          reject,
        })
      })
    }

    return Promise.reject(error)
  },
)

export default api
