import { useState, useMemo } from 'react'
import { Pencil, Trash2, CalendarDays } from 'lucide-react'
import { useCalendarStore } from '@/store/calendarStore'
import { EventModal } from '@/features/calendar/components/EventModal'
import api from '@/lib/api'
import type { CalendarEvent, EventType, EventStatus } from '@/types'
import type { CreateEventPayload, UpdateEventPayload } from '@/features/calendar/hooks/useCalendar'

// ── Priority by event type ────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<EventType, { label: string; cls: string; order: number }> = {
  deadline:   { label: 'Высокий', cls: 'bg-danger-dim text-danger',   order: 1 },
  tournament: { label: 'Высокий', cls: 'bg-danger-dim text-danger',   order: 1 },
  tryout:     { label: 'Средний', cls: 'bg-orange-dim text-orange',   order: 2 },
  camp:       { label: 'Средний', cls: 'bg-orange-dim text-orange',   order: 2 },
  other:      { label: 'Обычный', cls: 'bg-surface3 text-text-2',     order: 3 },
}

const TYPE_LABEL: Record<EventType, string> = {
  tournament: 'Турнир',
  camp:       'Лагерь',
  tryout:     'Просмотр',
  deadline:   'Дедлайн',
  other:      'Другое',
}

const TYPE_DOT: Record<EventType, string> = {
  tournament: 'bg-orange',
  camp:       'bg-accent',
  tryout:     'bg-[#4a9fff]',
  deadline:   'bg-danger',
  other:      'bg-text-3',
}

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export function UpcomingWeekCard() {
  // Read directly from the persisted store — no API call here.
  // The store already reflects all deletes/edits made via the Calendar page
  // (removeEvent immediately filters events + records in deletedIds).
  // Making an extra API call here was the cause of deleted events reappearing.
  const { events, updateEvent, removeEvent } = useCalendarStore()
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)

  const weekEvents = useMemo(() => {
    const now   = new Date()
    const start = now.toISOString().slice(0, 10)
    const end   = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10)

    return events
      .filter((e) => e.date >= start && e.date <= end && e.status === 'upcoming')
      .sort((a, b) => {
        const pa = PRIORITY_CONFIG[a.type as EventType]?.order ?? 3
        const pb = PRIORITY_CONFIG[b.type as EventType]?.order ?? 3
        return pa !== pb ? pa - pb : a.date.localeCompare(b.date)
      })
  }, [events])

  const handleEdit = async (payload: CreateEventPayload) => {
    if (!editEvent) return
    const patch: UpdateEventPayload = payload
    updateEvent(editEvent.id, patch)
    setEditEvent(null)
    try { await api.patch(`/calendar/${editEvent.id}`, patch) } catch { /* optimistic */ }
  }

  const handleDelete = async (id: string) => {
    removeEvent(id)
    try { await api.delete(`/calendar/${id}`) } catch { /* optimistic */ }
  }

  return (
    <div className="bg-surface border border-border rounded-card p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-3">
            Ближайшие 7 дней
          </h3>
          <p className="text-[11px] text-text-3 mt-0.5">Отсортировано по приоритету</p>
        </div>
        <span className="text-[11px] bg-surface3 text-text-2 px-2 py-0.5 rounded-full font-medium">
          {weekEvents.length}{' '}
          {weekEvents.length === 1 ? 'событие' : weekEvents.length < 5 ? 'события' : 'событий'}
        </span>
      </div>

      {weekEvents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center gap-2">
          <CalendarDays size={22} className="text-text-3" />
          <p className="text-sm text-text-3">Событий на ближайшую неделю нет</p>
        </div>
      ) : (
        // 2 events per row
        <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[320px] scrollbar-thin">
          {weekEvents.map((ev) => {
            const type   = ev.type as EventType
            const pCfg   = PRIORITY_CONFIG[type] ?? PRIORITY_CONFIG.other
            const dotCls = TYPE_DOT[type] ?? 'bg-text-3'

            return (
              <div key={ev.id} className="relative group bg-surface2 border border-border rounded-card p-3">
                {/* Type + Date */}
                <div className="flex items-center gap-1.5 mb-1.5 pr-12">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
                  <span className="text-[11px] font-medium text-text-2 truncate">
                    {TYPE_LABEL[type]}
                  </span>
                </div>

                {/* Title */}
                <p className="text-[12.5px] font-semibold text-text leading-snug line-clamp-2 pr-12">
                  {ev.title}
                </p>

                {/* Date */}
                <p className="text-[11px] text-text-3 mt-1">{formatDate(ev.date)}</p>

                {/* Notes */}
                {ev.notes && (
                  <p className="text-[11px] text-text-2 mt-1 leading-relaxed line-clamp-2">
                    {ev.notes}
                  </p>
                )}

                {/* Priority badge */}
                <div className="mt-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${pCfg.cls}`}>
                    {pCfg.label}
                  </span>
                </div>

                {/* Hover actions */}
                <div className="absolute top-2.5 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => setEditEvent(ev)}
                    className="w-5 h-5 rounded flex items-center justify-center text-text-3 hover:text-accent bg-surface3 hover:bg-accent-dim transition-all"
                    title="Редактировать"
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="w-5 h-5 rounded flex items-center justify-center text-text-3 hover:text-danger bg-surface3 hover:bg-danger-dim transition-all"
                    title="Удалить"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editEvent && (
        <EventModal
          editMode
          initialDate={editEvent.date}
          initialTitle={editEvent.title}
          initialType={editEvent.type as EventType}
          initialStatus={editEvent.status as EventStatus}
          initialNotes={editEvent.notes}
          onSave={handleEdit}
          onClose={() => setEditEvent(null)}
        />
      )}
    </div>
  )
}
