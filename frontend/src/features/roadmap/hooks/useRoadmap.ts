import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import type { RoadmapItem, RoadmapItemStatus } from '@/types'

export function useRoadmap() {
  const [allItems, setAllItems] = useState<RoadmapItem[]>([])
  const [activePhase, setActivePhase] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)

  const fetchRoadmap = useCallback(() => {
    setLoading(true)
    api.get<RoadmapItem[]>('/roadmap/')
      .then((r) => setAllItems(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchRoadmap() }, [fetchRoadmap])

  const updateStatus = async (id: string, status: RoadmapItemStatus) => {
    // optimistic update
    setAllItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, status } : i)
    )
    try {
      await api.patch(`/roadmap/${id}`, { status })
    } catch {
      fetchRoadmap() // revert on error
    }
  }

  const phases = [...new Set(allItems.map((i) => i.phase))]
  const items = activePhase ? allItems.filter((i) => i.phase === activePhase) : allItems

  return { phases, allItems, items, activePhase, setActivePhase, isLoading, updateStatus, refetch: fetchRoadmap }
}
