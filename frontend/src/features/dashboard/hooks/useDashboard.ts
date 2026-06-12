import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import api from '@/lib/api'
import type { RoadmapItem, CalendarEvent } from '@/types'

interface NextStep {
  title: string
  description: string
  ctaLabel: string
}

export function useDashboard() {
  const { player, metrics, setPlayer, setMetrics, isLoading, setLoading } = usePlayerStore()
  const [nextStep,     setNextStep]     = useState<NextStep | null>(null)
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([])
  const [events,       setEvents]       = useState<CalendarEvent[]>([])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/players/me').then((r)              => setPlayer(r.data)),
      api.get('/players/me/metrics').then((r)      => setMetrics(r.data)),
      api.get('/players/me/next-step').then((r)    => setNextStep(r.data)),
      api.get('/roadmap/?limit=4').then((r)        => setRoadmapItems(r.data)),
      api.get('/calendar/upcoming?limit=4').then((r) => setEvents(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false))
    // zustand-сеттеры стабильны — эффект должен выполниться один раз при маунте
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { player, metrics, nextStep, roadmapItems, events, isLoading }
}
