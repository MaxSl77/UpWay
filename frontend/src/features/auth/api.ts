import api from '@/lib/api'
import type { User, AuthTokens } from '@/types'

interface LoginResponse extends AuthTokens {
  user: User
}

interface RegisterPayload {
  fullName: string
  email: string
  password: string
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    return data
  },

  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/register', payload)
    return data
  },

  logout: async (refreshToken: string): Promise<void> => {
    // Revoke refresh token server-side; ignore errors (token may already be expired)
    await api.post('/auth/logout', { refreshToken }).catch(() => {})
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/auth/verify-email', { token })
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/password-reset/request', { email })
  },

  confirmPasswordReset: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/password-reset/confirm', { token, newPassword })
  },

  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const { data } = await api.post<AuthTokens>('/auth/refresh', { refreshToken })
    return data
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
}
