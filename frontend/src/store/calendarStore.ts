import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalendarEvent, EventType } from '@/types'

export interface PendingCalendarEvent {
  tempId: string
  title: string
  type: EventType
  date: string
  notes?: string
  fromMessage?: string
}

interface CalendarState {
  events: CalendarEvent[]
  deletedIds: string[]
  pendingEvents: PendingCalendarEvent[]

  setEvents: (fresh: CalendarEvent[]) => void
  addEvent: (event: CalendarEvent) => void
  removeEvent: (id: string) => void
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void

  addPending: (event: Omit<PendingCalendarEvent, 'tempId'>) => void
  removePending: (tempId: string) => void
  clearPending: () => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      deletedIds: [],
      pendingEvents: [],

      // Merge API data with local state:
      // - filter out deleted IDs
      // - keep local edits for existing events (prefer local over API)
      // - keep local-only events (id starts with 'local-')
      setEvents: (fresh) =>
        set((state) => {
          const filtered = fresh.filter((e) => !state.deletedIds.includes(e.id))
          const merged = filtered.map((apiEv) => {
            const local = state.events.find((e) => e.id === apiEv.id)
            return local ?? apiEv // keep local version if we have it (has edits)
          })
          const localOnly = state.events.filter(
            (e) => e.id.startsWith('local-') && !state.deletedIds.includes(e.id),
          )
          return { events: [...merged, ...localOnly] }
        }),

      addEvent: (event) =>
        set((state) => ({ events: [...state.events, event] })),

      removeEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          deletedIds: [...state.deletedIds, id],
        })),

      updateEvent: (id, patch) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      addPending: (event) =>
        set((state) => ({
          pendingEvents: [
            ...state.pendingEvents,
            { ...event, tempId: `pending-${Date.now()}-${Math.random()}` },
          ],
        })),

      removePending: (tempId) =>
        set((state) => ({
          pendingEvents: state.pendingEvents.filter((e) => e.tempId !== tempId),
        })),

      clearPending: () => set({ pendingEvents: [] }),
    }),
    {
      name: 'upway-calendar',
      partialize: (state) => ({
        events: state.events,
        deletedIds: state.deletedIds,
      }),
    },
  ),
)
