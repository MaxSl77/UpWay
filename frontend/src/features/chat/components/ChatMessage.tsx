import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { useCalendarStore } from '@/store/calendarStore'
import { useSettingsStore } from '@/store/settingsStore'
import { EventModal } from '@/features/calendar/components/EventModal'
import type { ChatMessage as ChatMessageType } from '@/types'
import type { CreateEventPayload } from '@/features/calendar/hooks/useCalendar'

// ── Heuristic: detect date-like text in AI message ──────────────────────────
// Looks for patterns like "12 марта", "12 March", "2025-06-15", "15.06.2025"
const DATE_PATTERNS = [
  /\b(\d{4}-\d{2}-\d{2})\b/,
  /\b(\d{1,2}[./]\d{1,2}[./]\d{2,4})\b/,
  /\b(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i,
  /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
  /\b(турнир|лагерь|просмотр|дедлайн|tournament|camp|tryout|deadline)\b/i,
]

function hasCalendarContent(text: string): boolean {
  return DATE_PATTERNS.some((p) => p.test(text))
}

function extractDate(text: string): string {
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (isoMatch) return isoMatch[1]

  const dotMatch = text.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{2,4})\b/)
  if (dotMatch) {
    const [, d, m, y] = dotMatch
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
  }

  // No explicit date — use today
  return new Date().toISOString().slice(0, 10)
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  message: ChatMessageType
}

export function ChatMessage({ message }: Props) {
  const isAI = message.role === 'assistant'
  const { language } = useSettingsStore()
  const addPending = useCalendarStore((s) => s.addPending)

  const [showModal, setShowModal] = useState(false)
  const [added, setAdded]         = useState(false)

  const showCalendarBtn = isAI && hasCalendarContent(message.content)

  const handleAddToCalendar = async (payload: CreateEventPayload): Promise<void> => {
    // Push to pendingEvents — user confirms on Calendar page
    addPending({
      title: payload.title,
      type:  payload.type,
      date:  payload.date,
      notes: payload.notes,
      fromMessage: message.content.slice(0, 80),
    })
    setAdded(true)
    setShowModal(false)
  }

  const addLabel   = language === 'ru' ? 'В календарь' : 'Add to calendar'
  const addedLabel = language === 'ru' ? 'Добавлено ✓'  : 'Added ✓'

  return (
    <>
      <div
        className={cn(
          'flex gap-2.5 max-w-[72%]',
          isAI ? 'self-start' : 'self-end flex-row-reverse',
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            'w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold self-end',
            isAI
              ? 'bg-surface3 text-accent'
              : 'bg-gradient-to-br from-[#1a5c3a] to-accent text-white',
          )}
        >
          {isAI ? '🤖' : 'A'}
        </div>

        {/* Bubble */}
        <div className="flex flex-col min-w-0">
          <div
            className={cn(
              'px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed',
              isAI
                ? 'bg-bubble-ai border border-border rounded-bl-sm'
                : 'bg-bubble-parent border border-accent/20 rounded-br-sm text-[#e2f8ec]',
            )}
          >
            {message.content}

            {isAI && message.contextCard && (
              <div className="mt-2.5 bg-surface border border-border border-l-[3px] border-l-accent rounded-lg px-3.5 py-3 text-[12.5px] text-text-2">
                <strong>Context:</strong> {message.contextCard}
              </div>
            )}
          </div>

          {/* Action row under bubble */}
          <div className={cn('flex items-center gap-2 mt-1.5', isAI ? '' : 'flex-row-reverse')}>
            <p className="text-[10.5px] text-text-3">
              {formatDate(message.createdAt)}
            </p>

            {showCalendarBtn && (
              <button
                onClick={() => !added && setShowModal(true)}
                disabled={added}
                className={cn(
                  'flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium border transition-all',
                  added
                    ? 'bg-accent-dim border-accent text-accent cursor-default'
                    : 'bg-surface2 border-border text-text-2 hover:border-accent hover:text-accent',
                )}
              >
                {added ? (
                  addedLabel
                ) : (
                  <>
                    <CalendarPlus size={11} />
                    {addLabel}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Event modal pre-filled from message */}
      {showModal && (
        <EventModal
          initialDate={extractDate(message.content)}
          onSave={handleAddToCalendar}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
