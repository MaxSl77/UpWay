import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'

export function UpcomingEventsCard({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h4 className="font-display text-sm font-bold">Upcoming Events</h4>
        <span className="text-[11px] text-text-3">
          <span className="text-accent">●</span> Submitted&nbsp;&nbsp;
          <span className="text-orange">●</span> Action needed
        </span>
      </div>
      <div className="px-5 pt-2 pb-4">
        {events.slice(0, 4).map((ev) => (
          <div key={ev.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1',
                ev.status === 'submitted' && 'bg-accent shadow-[0_0_6px_rgba(34,214,122,.4)]',
                ev.status === 'action_needed' && 'bg-orange shadow-[0_0_6px_rgba(245,158,58,.4)]',
              )}
            />
            <div>
              <p className="text-[13px] font-medium">{ev.title}</p>
              <p className={cn(
                'text-[11.5px] mt-0.5',
                ev.status === 'action_needed' ? 'text-orange' : 'text-text-2',
              )}>
                {ev.notes}
              </p>
              <p className="text-[11px] text-text-3">{ev.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
