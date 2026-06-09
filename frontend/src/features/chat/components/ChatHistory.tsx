import { useChatStore } from '@/store/chatStore'
import { useChat } from '../hooks/useChat'
import { cn } from '@/lib/utils'

export function ChatHistory() {
  const { sessions, activeSessionId, setActiveSession } = useChatStore()
  const { createSession } = useChat()

  const today = sessions.filter((s) =>
    new Date(s.updatedAt).toDateString() === new Date().toDateString(),
  )
  const earlier = sessions.filter(
    (s) => new Date(s.updatedAt).toDateString() !== new Date().toDateString(),
  )

  return (
    <aside className="w-[240px] flex-shrink-0 bg-surface border-r border-border flex flex-col overflow-hidden">
      <div className="p-3 border-b border-border">
        <button
          onClick={createSession}
          className="w-full h-8 bg-accent text-[#0a1a11] rounded-btn text-[13px] font-semibold hover:bg-[#30e887] transition-all"
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {today.length > 0 && (
          <>
            <p className="text-[10px] font-semibold tracking-widest text-text-3 uppercase px-3 py-2">Today</p>
            {today.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                active={s.id === activeSessionId}
                onClick={() => setActiveSession(s.id)}
              />
            ))}
          </>
        )}
        {earlier.length > 0 && (
          <>
            <p className="text-[10px] font-semibold tracking-widest text-text-3 uppercase px-3 py-2">Earlier</p>
            {earlier.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                active={s.id === activeSessionId}
                onClick={() => setActiveSession(s.id)}
              />
            ))}
          </>
        )}
      </div>
    </aside>
  )
}

function SessionItem({
  session,
  active,
  onClick,
}: {
  session: { id: string; title: string; updatedAt: string }
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-colors',
        active ? 'bg-accent-dim' : 'hover:bg-surface2',
      )}
    >
      <p className="text-[12.5px] font-medium truncate">{session.title}</p>
      <p className="text-[11px] text-text-3 mt-0.5">
        {new Date(session.updatedAt).toLocaleDateString()}
      </p>
    </button>
  )
}
