import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Opportunity, OppType } from '@/types'

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [filter, setFilter] = useState<OppType | 'all'>('all')
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const q = filter !== 'all' ? `?type=${filter}` : ''
    api.get(`/opportunities${q}`)
      .then((r) => setOpportunities(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  return { opportunities, filter, setFilter, isLoading }
}
