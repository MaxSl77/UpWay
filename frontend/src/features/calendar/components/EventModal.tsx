import { useState } from 'react'
import { X, CalendarDays, Loader2 } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import type { EventType, EventStatus } from '@/types'
import type { CreateEventPayload } from '../hooks/useCalendar'

interface EventModalProps {
  initialDate?: string
  initialTitle?: string
  initialType?: EventType
  initialStatus?: EventStatus
  initialNotes?: string
  editMode?: boolean
  onSave: (payload: CreateEventPayload) => Promise<void>
  onClose: () => void
}

const EVENT_TYPES: { id: EventType; labelRu: string; labelEn: string; color: string }[] = [
  { id: 'tournament', labelRu: 'Турнир',   labelEn: 'Tournament', color: 'text-orange border-orange bg-orange-dim' },
  { id: 'camp',       labelRu: 'Лагерь',   labelEn: 'Camp',       color: 'text-accent border-accent bg-accent-dim' },
  { id: 'tryout',     labelRu: 'Просмотр', labelEn: 'Tryout',     color: 'text-[#4a9fff] border-[#4a9fff] bg-[rgba(74,159,255,0.12)]' },
  { id: 'deadline',   labelRu: 'Дедлайн',  labelEn: 'Deadline',   color: 'text-danger border-danger bg-danger-dim' },
  { id: 'other',      labelRu: 'Другое',   labelEn: 'Other',      color: 'text-text-2 border-border bg-surface3' },
]

const STATUS_OPTIONS: { id: EventStatus; labelRu: string; labelEn: string }[] = [
  { id: 'upcoming',   labelRu: 'Предстоящее',  labelEn: 'Upcoming' },
  { id: 'completed',  labelRu: 'Завершённое',  labelEn: 'Completed' },
]

export function EventModal({
  initialDate,
  initialTitle = '',
  initialType = 'other',
  initialStatus = 'upcoming',
  initialNotes = '',
  editMode = false,
  onSave,
  onClose,
}: EventModalProps) {
  const { language } = useSettingsStore()

  const today = new Date().toISOString().slice(0, 10)

  const [title,  setTitle]  = useState(initialTitle)
  const [type,   setType]   = useState<EventType>(initialType)
  const [date,   setDate]   = useState(initialDate ?? today)
  const [status, setStatus] = useState<EventStatus>(initialStatus)
  const [notes,  setNotes]  = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const t = {
    addTitle:  language === 'ru' ? 'Новое событие'       : 'New event',
    editTitle: language === 'ru' ? 'Редактировать событие' : 'Edit event',
    titleLbl:  language === 'ru' ? 'Название'            : 'Title',
    titlePh:   language === 'ru' ? 'Напр. Турнир «Кубок»…' : 'E.g. Cup Tournament…',
    typeLbl:   language === 'ru' ? 'Тип события'         : 'Event type',
    dateLbl:   language === 'ru' ? 'Дата'                : 'Date',
    statusLbl: language === 'ru' ? 'Статус'              : 'Status',
    notesLbl:  language === 'ru' ? 'Заметки'             : 'Notes',
    notesPh:   language === 'ru' ? 'Дополнительная информация…' : 'Additional info…',
    save:      language === 'ru' ? (editMode ? 'Сохранить' : 'Добавить') : (editMode ? 'Save' : 'Add event'),
    cancel:    language === 'ru' ? 'Отмена'              : 'Cancel',
    required:  language === 'ru' ? 'Введите название'    : 'Title is required',
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError(t.required); return }
    setSaving(true)
    try {
      await onSave({ title: title.trim(), type, status, date, notes: notes.trim() || undefined })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[420px] bg-surface border border-border rounded-card shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-accent" />
            <h3 className="font-semibold text-[14px]">{editMode ? t.editTitle : t.addTitle}</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-text-3 hover:text-text hover:bg-surface2 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-text-2 uppercase tracking-wider mb-1.5">
              {t.titleLbl}
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              placeholder={t.titlePh}
              className="w-full h-9 px-3 bg-surface2 border border-border rounded-btn text-[13.5px] outline-none focus:border-accent transition-colors placeholder:text-text-3"
            />
            {error && <p className="text-danger text-[11px] mt-1">{error}</p>}
          </div>

          {/* Type chips */}
          <div>
            <label className="block text-[11px] font-semibold text-text-2 uppercase tracking-wider mb-1.5">
              {t.typeLbl}
            </label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((et) => (
                <button
                  key={et.id}
                  onClick={() => setType(et.id)}
                  className={[
                    'h-7 px-3 rounded-full text-[11.5px] font-medium border transition-all',
                    type === et.id ? et.color : 'text-text-3 border-border bg-surface2 hover:border-text-3',
                  ].join(' ')}
                >
                  {language === 'ru' ? et.labelRu : et.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-2 uppercase tracking-wider mb-1.5">
                {t.dateLbl}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 px-3 bg-surface2 border border-border rounded-btn text-[13px] outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-2 uppercase tracking-wider mb-1.5">
                {t.statusLbl}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full h-9 px-3 bg-surface2 border border-border rounded-btn text-[13px] outline-none focus:border-accent transition-colors"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {language === 'ru' ? s.labelRu : s.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-text-2 uppercase tracking-wider mb-1.5">
              {t.notesLbl}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPh}
              rows={3}
              className="w-full px-3 py-2 bg-surface2 border border-border rounded-btn text-[13px] outline-none focus:border-accent transition-colors placeholder:text-text-3 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="h-9 px-4 rounded-btn bg-surface2 border border-border text-[13px] text-text-2 hover:text-text hover:border-text-3 transition-all">
            {t.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="h-9 px-5 rounded-btn bg-accent text-[#0a1a11] text-[13px] font-semibold hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
