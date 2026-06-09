import api from '@/lib/api'
import type { Player } from '@/types'

export interface PlayerUpdatePayload {
  name?: string
  age?: number
  heightCm?: number
  weightKg?: number
  position?: string
  country?: string
  city?: string
  team?: string
  hockeySchool?: string
  level?: string
  goals?: string[]
  skills?: {
    skating: number
    shooting: number
    passing: number
    fitness: number
    sense: number
  }
}

export const profileApi = {
  getPlayer: (): Promise<Player> =>
    api.get('/players/me').then((r) => r.data),

  updatePlayer: (payload: PlayerUpdatePayload): Promise<Player> =>
    api.patch('/players/me', payload).then((r) => r.data),
}
