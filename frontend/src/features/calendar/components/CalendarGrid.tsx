import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, Pencil } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { EventModal } from './EventModal'
import { PendingEventsBar } from './PendingEventsBar'
import type { CalendarEvent, EventType, EventStatus } from '@/types'
import type { CreateEventPayload, UpdateEventPayload } from '../hooks/useCalendar'

// ── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<EventType, { dot: string; badge: string; labelRu: string; labelEn: string }> = {
  tournament: { dot: 'bg-orange',    badge: 'bg-orange-dim text-orange border-orange',                          labelRu: 'Турнир',   labelEn: 'Tournament' },
  camp:       { dot: 'bg-accent',    badge: 'bg-accent-dim text-accent border-accent',                          labelRu: 'Лагерь',   labelEn: 'Camp' },
  tryout:     { dot: 'bg-[#4a9fff]', badge: 'bg-[rgba(74,159,255,0.12)] text-[#4a9fff] border-[#4a9fff]',      labelRu: 'Просмотр', labelEn: 'Tryout' },
  deadline:   { dot: 'bg-danger',    badge: 'bg-danger-dim text-danger border-danger',                          labelRu: 'Дедлайн',  labelEn: 'Deadline' },
  other:      { dot: 'bg-text-3',    badge: 'bg-surface3 text-text-2 border-border',                            labelRu: 'Другое',   labelEn: 'Other' },
}

const STATUS_LABELS: Record<EventStatus, { ru: string; en: string }> = {
  upcoming:      { ru: 'Предстоящее',      en: 'Upcoming' },
  completed:     { ru: 'Завершённое',      en: 'Completed' },
  registered:    { ru: 'Зарегистрировано', en: 'Registered' },
  submitted:     { ru: 'Заявка подана',    en: 'Submitted' },
  action_needed: { ru: 'Требует действия', en: 'Action needed' },
}

// ── Calendar math ────────────────────────────────────────────────────────────
function getMonthMatrix(year: number, month: number): (number | null)[][] {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const rows: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ── Props ────────────────────────────────────────────────────────────────────
interface CalendarGridProps {
  month: Date
  events: CalendarEvent[]
  onMonthChange: (d: Date) => void
  onCreateEvent: (payload: CreateEventPayload) => Promise<void>
  onEditEvent: (id: string, patch: UpdateEventPayload) => void
  onDeleteEvent: (id: string) => void
  isLoading: boolean
}

const MONTH_NAMES_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES_RU   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
const DAY_NAMES_EN   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export function CalendarGrid({ month, events, onMonthChange, onCreateEvent, onEditEvent, onDeleteEvent, isLoading }: CalendarGridProps) {
  const { language } = useSettingsStore()

  const year     = month.getFullYear()
  const monthIdx = month.getMonth()
  const matrix   = useMemo(() => getMonthMatrix(year, monthIdx), [year, monthIdx])

  const todayISO  = new Date().toISOString().slice(0, 10)
  const [selectedISO, setSelectedISO] = useState<string>(todayISO)
  const [addModal, setAddModal]       = useState<string | null>(null) // date string
  const [editEvent, setEditEvent]     = useState<CalendarEvent | null>(null)

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    }
    return map
  }, [events])

  const selectedEvents = eventsByDate[selectedISO] ?? []

  const prevMonth = () => onMonthChange(new Date(year, monthIdx - 1, 1))
  const nextMonth = () => onMonthChange(new Date(year, monthIdx + 1, 1))

  const monthLabel = (language === 'ru' ? MONTH_NAMES_RU : MONTH_NAMES_EN)[monthIdx]
  const dayNames   = language === 'ru' ? DAY_NAMES_RU : DAY_NAMES_EN
  const addLabel   = language === 'ru' ? 'Добавить событие' : 'Add event'
  const todayLabel = language === 'ru' ? 'Сегодня' : 'Today'
  const noEventsMsg = language === 'ru' ? 'Нет событий' : 'No events'

  const handleEdit = async (payload: CreateEventPayload) => {
    if (!editEvent) return
    onEditEvent(editEvent.id, payload)
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <PendingEventsBar onAccept={onCreateEvent} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="w-8 h-8 rounded-btn bg-surface2 border border-border flex items-center justify-center text-text-2 hover:text-text hover:border-text-3 transition-colors">
          <ChevronLeft size={15} />
        </button>
        <h2 className="font-display font-bold text-[16px] min-w-[160px] text-center">
          {monthLabel} {year}
        </h2>
        <button onClick={nextMonth} className="w-8 h-8 rounded-btn bg-surface2 border border-border flex items-center justify-center text-text-2 hover:text-text hover:border-text-3 transition-colors">
          <ChevronRight size={15} />
        </button>
        <button
          onClick={() => { onMonthChange(new Date()); setSelectedISO(todayISO) }}
          className="h-8 px-3 rounded-btn bg-surface2 border border-border text-[12px] text-text-2 hover:text-text hover:border-text-3 transition-colors"
        >
          {todayLabel}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setAddModal(todayISO)}
          className="h-8 px-3 rounded-btn bg-accent text-[#0a1a11] text-[12.5px] font-semibold hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <Plus size={13} />
          {addLabel}
        </button>
      </div>

      {/* Main 2-col layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Month grid */}
        <div className="flex-1 flex flex-col bg-surface border border-border rounded-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border flex-shrink-0">
            {dayNames.map((d, i) => (
              <div key={d} className={`py-2 text-center text-[11px] font-semibold uppercase tracking-wider ${i >= 5 ? 'text-text-3' : 'text-text-2'}`}>
                {d}
              </div>
            ))}
          </div>

          <div className="flex flex-col flex-1">
            {matrix.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 flex-1 border-b border-border last:border-0">
                {row.map((day, ci) => {
                  if (!day) return <div key={ci} className="border-r border-border last:border-0 bg-surface2/30" />
                  const iso       = toISO(year, monthIdx, day)
                  const isToday   = iso === todayISO
                  const isSelected = iso === selectedISO
                  const dayEvents  = eventsByDate[iso] ?? []
                  const isWeekend  = ci >= 5

                  return (
                    <div
                      key={ci}
                      onClick={() => setSelectedISO(iso)}
                      onDoubleClick={() => setAddModal(iso)}
                      className={[
                        'border-r border-border last:border-0 p-1.5 cursor-pointer transition-colors group relative',
                        isSelected ? 'bg-accent-dim' : isToday ? 'bg-surface2' : isWeekend ? 'bg-surface/50' : '',
                        'hover:bg-surface2',
                      ].join(' ')}
                    >
                      <div className={[
                        'w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-medium mb-1',
                        isToday ? 'bg-accent text-[#0a1a11] font-bold' : isSelected ? 'text-accent' : isWeekend ? 'text-text-3' : 'text-text-2',
                      ].join(' ')}>
                        {day}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div key={ev.id} className={`text-[10px] leading-none px-1 py-0.5 rounded truncate border ${TYPE_CONFIG[ev.type as EventType]?.badge ?? ''}`}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-text-3 pl-1">+{dayEvents.length - 2}</div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAddModal(iso) }}
                        className="absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center bg-surface3 text-text-3 opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-[#0a1a11] transition-all"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Day panel */}
        <div className="w-[240px] flex-shrink-0 flex flex-col gap-3">
          <div className="bg-surface border border-border rounded-card p-3.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">
                {(() => {
                  const d = new Date(selectedISO + 'T12:00:00')
                  return language === 'ru'
                    ? d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
                    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                })()}
              </p>
              <button
                onClick={() => setAddModal(selectedISO)}
                className="w-6 h-6 rounded-md bg-accent-dim border border-accent flex items-center justify-center text-accent hover:bg-accent hover:text-[#0a1a11] transition-all"
              >
                <Plus size={11} />
              </button>
            </div>
            {selectedISO === todayISO && (
              <span className="text-[10px] bg-accent-dim text-accent px-2 py-0.5 rounded-full font-medium">
                {todayLabel}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-2">
            {isLoading ? (
              <div className="text-center text-text-3 text-[12px] py-8">
                {language === 'ru' ? 'Загрузка...' : 'Loading...'}
              </div>
            ) : selectedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays size={24} className="text-text-3 mb-2" />
                <p className="text-[12px] text-text-3">{noEventsMsg}</p>
                <button
                  onClick={() => setAddModal(selectedISO)}
                  className="mt-3 h-7 px-3 rounded-btn bg-surface2 border border-border text-[12px] text-text-2 hover:border-accent hover:text-accent transition-all"
                >
                  {language === 'ru' ? 'Добавить' : 'Add'}
                </button>
              </div>
            ) : (
              selectedEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  language={language}
                  onEdit={() => setEditEvent(ev)}
                  onDelete={onDeleteEvent}
                />
              ))
            )}
          </div>

          {events.length > 0 && (
            <div className="bg-surface border border-border rounded-card p-3">
              <p className="text-[11px] text-text-3 uppercase tracking-wider font-semibold mb-2">
                {language === 'ru' ? 'В этом месяце' : 'This month'}
              </p>
              <p className="text-[13px] font-semibold">{events.length}</p>
              <p className="text-[11px] text-text-2">
                {language === 'ru' ? 'событий запланировано' : 'events scheduled'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {addModal !== null && (
        <EventModal
          initialDate={addModal}
          onSave={onCreateEvent}
          onClose={() => setAddModal(null)}
        />
      )}

      {/* Edit modal */}
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

// ── EventCard ────────────────────────────────────────────────────────────────
function EventCard({ event, language, onEdit, onDelete }: {
  event: CalendarEvent
  language: string
  onEdit: () => void
  onDelete: (id: string) => void
}) {
  const type   = event.type as EventType
  const status = event.status as EventStatus
  const cfg    = TYPE_CONFIG[type]
  const statusL = STATUS_LABELS[status]

  return (
    <div className="bg-surface border border-border rounded-card p-3 group relative">
      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium mb-1.5 ${cfg.badge}`}>
        {language === 'ru' ? cfg.labelRu : cfg.labelEn}
      </span>
      <p className="text-[13px] font-semibold leading-snug mb-1 pr-12">{event.title}</p>
      {statusL && (
        <p className="text-[11px] text-text-2">{language === 'ru' ? statusL.ru : statusL.en}</p>
      )}
      {event.notes && (
        <p className="text-[11px] text-text-3 mt-1 line-clamp-2">{event.notes}</p>
      )}

      {/* Edit + Delete buttons */}
      <div className="absolute top-2.5 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button
          onClick={onEdit}
          className="w-5 h-5 rounded flex items-center justify-center text-text-3 hover:text-accent transition-all"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={() => onDelete(event.id)}
          className="w-5 h-5 rounded flex items-center justify-center text-text-3 hover:text-danger transition-all"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}
