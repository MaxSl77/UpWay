import { CalendarPlus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useCalendarStore } from '@/store/calendarStore'
import { useSettingsStore } from '@/store/settingsStore'
import { EventModal } from './EventModal'
import type { CreateEventPayload } from '../hooks/useCalendar'
import type { PendingCalendarEvent } from '@/store/calendarStore'

interface Props {
  onAccept: (payload: CreateEventPayload) => Promise<void>
}

export function PendingEventsBar({ onAccept }: Props) {
  const { pendingEvents, removePending } = useCalendarStore()
  const { language } = useSettingsStore()
  const [expanded, setExpanded] = useState(true)
  const [editingEvent, setEditingEvent] = useState<PendingCalendarEvent | null>(null)

  if (pendingEvents.length === 0) return null

  const t = {
    title:   language === 'ru' ? 'AI предлагает добавить в календарь' : 'AI suggested events',
    dismiss: language === 'ru' ? 'Отклонить' : 'Dismiss',
    add:     language === 'ru' ? 'Добавить' : 'Add',
    from:    language === 'ru' ? 'Из чата:' : 'From chat:',
  }

  const handleAccept = async (pending: PendingCalendarEvent) => {
    setEditingEvent(pending)
  }

  const handleSaveFromModal = async (payload: CreateEventPayload) => {
    await onAccept(payload)
    if (editingEvent) removePending(editingEvent.tempId)
    setEditingEvent(null)
  }

  return (
    <>
      <div className="bg-accent-dim border border-accent rounded-card overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer"
          onClick={() => setExpanded((p) => !p)}
        >
          <CalendarPlus size={14} className="text-accent flex-shrink-0" />
          <span className="text-[12.5px] font-semibold text-accent flex-1">
            {t.title} ({pendingEvents.length})
          </span>
          {expanded ? <ChevronUp size={13} className="text-accent" /> : <ChevronDown size={13} className="text-accent" />}
        </div>

        {/* Events list */}
        {expanded && (
          <div className="border-t border-accent/30 divide-y divide-accent/20">
            {pendingEvents.map((ev) => (
              <div key={ev.tempId} className="flex items-start gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate">{ev.title}</p>
                  <p className="text-[11px] text-text-2">{ev.date}</p>
                  {ev.fromMessage && (
                    <p className="text-[11px] text-text-3 truncate mt-0.5">
                      {t.from} {ev.fromMessage}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  <button
                    onClick={() => handleAccept(ev)}
                    className="h-7 px-3 rounded-btn bg-accent text-[#0a1a11] text-[12px] font-semibold hover:opacity-90 transition-all"
                  >
                    {t.add}
                  </button>
                  <button
                    onClick={() => removePending(ev.tempId)}
                    className="w-7 h-7 rounded-btn bg-surface2 border border-border flex items-center justify-center text-text-3 hover:text-danger hover:border-danger transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingEvent && (
        <EventModal
          initialDate={editingEvent.date}
          initialTitle={editingEvent.title}
          initialType={editingEvent.type}
          initialNotes={editingEvent.notes}
          onSave={handleSaveFromModal}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </>
  )
}
