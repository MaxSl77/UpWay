import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useCalendarStore } from '@/store/calendarStore'
import type { CalendarEvent, EventType, EventStatus } from '@/types'

export interface CreateEventPayload {
  title: string
  type: EventType
  status: EventStatus
  date: string
  notes?: string
}

export interface UpdateEventPayload {
  title?: string
  type?: EventType
  status?: EventStatus
  date?: string
  notes?: string
}

export function useCalendar() {
  const {
    events,
    setEvents,
    addEvent,
    removeEvent,
    updateEvent,
  } = useCalendarStore()

  const [month, setMonth]   = useState(new Date())
  const [isLoading, setLoading] = useState(false)

  const fetchEvents = useCallback(async (d: Date) => {
    setLoading(true)
    try {
      const { data } = await api.get<CalendarEvent[]>(
        `/calendar/?year=${d.getFullYear()}&month=${d.getMonth() + 1}`
      )
      setEvents(data) // store handles deletedIds filter
    } catch {
      // Keep existing store state on error
    } finally {
      setLoading(false)
    }
  }, [setEvents])

  useEffect(() => {
    fetchEvents(month)
  }, [month, fetchEvents])

  const createEvent = async (payload: CreateEventPayload): Promise<CalendarEvent | null> => {
    try {
      const { data } = await api.post<CalendarEvent>('/calendar/', payload)
      addEvent(data)
      return data
    } catch {
      const local: CalendarEvent = {
        id: `local-${Date.now()}`,
        playerId: '',
        ...payload,
      }
      addEvent(local)
      return local
    }
  }

  const deleteEvent = async (id: string) => {
    removeEvent(id) // persists via store
    try {
      await api.delete(`/calendar/${id}`)
    } catch { /* already removed from store */ }
  }

  const editEvent = async (id: string, patch: UpdateEventPayload) => {
    updateEvent(id, patch)
    try {
      await api.patch(`/calendar/${id}`, patch)
    } catch { /* optimistic — local update is enough */ }
  }

  return {
    events,
    month,
    isLoading,
    setMonth,
    createEvent,
    deleteEvent,
    editEvent,
  }
}
