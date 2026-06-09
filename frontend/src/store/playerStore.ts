import { create } from 'zustand'
import type { Player, DashboardMetrics } from '@/types'

interface PlayerState {
  player: Player | null
  metrics: DashboardMetrics | null
  isLoading: boolean
  error: string | null

  setPlayer: (player: Player) => void
  setMetrics: (metrics: DashboardMetrics) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  player: null,
  metrics: null,
  isLoading: false,
  error: null,

  setPlayer:  (player)  => set({ player }),
  setMetrics: (metrics) => set({ metrics }),
  setLoading: (isLoading) => set({ isLoading }),
  setError:   (error)   => set({ error }),
  reset: () => set({ player: null, metrics: null, error: null }),
}))
