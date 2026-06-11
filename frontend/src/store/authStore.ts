import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { authApi } from '@/features/auth/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  bootstrapped: boolean

  setUser: (user: User) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => Promise<void>
  forceLogout: () => void
  initialize: () => Promise<void>
}

const clearState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...clearState,
      bootstrapped: false,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      forceLogout: () => set({ ...clearState, bootstrapped: true }),

      logout: async () => {
        const { refreshToken } = get()
        if (refreshToken) {
          await authApi.logout(refreshToken)
        }
        set({ ...clearState, bootstrapped: true })
      },

      initialize: async () => {
        const { isAuthenticated } = get()
        if (!isAuthenticated) {
          set({ bootstrapped: true })
          return
        }
        try {
          const user = await authApi.me()
          set({ user, bootstrapped: true })
        } catch {
          // Token is stale (user deleted, expired, etc.) — clear everything
          set({ ...clearState, bootstrapped: true })
        }
      },
    }),
    {
      name: 'upway-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
