import { TopBar } from '@/components/layout/TopBar'
import { CalendarGrid } from '@/features/calendar/components/CalendarGrid'
import { useCalendar } from '@/features/calendar/hooks/useCalendar'
import { useSettingsStore } from '@/store/settingsStore'
import type { CreateEventPayload } from '@/features/calendar/hooks/useCalendar'

export default function CalendarPage() {
  const { language } = useSettingsStore()
  const { events, month, setMonth, isLoading, createEvent, editEvent, deleteEvent } = useCalendar()

  const title    = language === 'ru' ? 'Календарь' : 'Calendar'
  const subtitle = language === 'ru' ? 'Турниры, лагеря и дедлайны' : 'Tournaments, camps & deadlines'

  const handleCreate = async (payload: CreateEventPayload): Promise<void> => {
    await createEvent(payload)
  }

  return (
    <>
      <TopBar title={title} subtitle={subtitle} />
      <div className="flex-1 overflow-hidden px-7 py-5 pb-4 flex flex-col min-h-0">
        <CalendarGrid
          month={month}
          events={events}
          onMonthChange={setMonth}
          onCreateEvent={handleCreate}
          onEditEvent={editEvent}
          onDeleteEvent={deleteEvent}
          isLoading={isLoading}
        />
      </div>
    </>
  )
}
