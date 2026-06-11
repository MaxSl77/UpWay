import { useState, useRef, useEffect } from 'react'
import { Trash2, Pencil, Check, X } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useChat } from '../hooks/useChat'
import { cn } from '@/lib/utils'

export function ChatHistory() {
  const { sessions, activeSessionId } = useChatStore()
  const { createSession, selectSession, deleteSession, renameSession } = useChat()

  const today = sessions.filter(
    (s) => new Date(s.updatedAt).toDateString() === new Date().toDateString(),
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
        {sessions.length === 0 && (
          <p className="text-[11px] text-text-3 text-center mt-6 px-3">
            Нет диалогов. Нажми + New Chat чтобы начать.
          </p>
        )}

        {today.length > 0 && (
          <>
            <p className="text-[10px] font-semibold tracking-widest text-text-3 uppercase px-3 py-2">Today</p>
            {today.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                active={s.id === activeSessionId}
                onSelect={() => selectSession(s.id)}
                onDelete={() => deleteSession(s.id)}
                onRename={(title) => renameSession(s.id, title)}
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
                onSelect={() => selectSession(s.id)}
                onDelete={() => deleteSession(s.id)}
                onRename={(title) => renameSession(s.id, title)}
              />
            ))}
          </>
        )}
      </div>
    </aside>
  )
}

// ── SessionItem ───────────────────────────────────────────────────────────────

interface SessionItemProps {
  session: { id: string; title: string; updatedAt: string }
  active: boolean
  onSelect: () => void
  onDelete: () => Promise<void>
  onRename: (title: string) => void
}

function SessionItem({ session, active, onSelect, onDelete, onRename }: SessionItemProps) {
  const [hovered, setHovered]   = useState(false)
  const [editing, setEditing]   = useState(false)
  const [draft,   setDraft]     = useState(session.title)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Фокус при входе в режим редактирования
  useEffect(() => {
    if (editing) {
      setDraft(session.title)
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }, [editing, session.title])

  const confirmRename = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== session.title) onRename(trimmed)
    setEditing(false)
  }

  const cancelRename = () => {
    setDraft(session.title)
    setEditing(false)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try { await onDelete() } finally { setDeleting(false) }
  }

  return (
    <div
      className={cn(
        'group relative flex items-center rounded-lg mb-0.5 transition-colors',
        active ? 'bg-accent-dim' : 'hover:bg-surface2',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false) }}
    >
      {editing ? (
        /* ── Режим редактирования ── */
        <div className="flex items-center gap-1 w-full px-2 py-1.5">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmRename()
              if (e.key === 'Escape') cancelRename()
            }}
            className="flex-1 bg-surface3 border border-accent/40 rounded px-2 py-0.5 text-[12px] text-text outline-none focus:border-accent"
          />
          <button onClick={confirmRename} className="text-accent hover:text-[#30e887] p-0.5">
            <Check size={13} />
          </button>
          <button onClick={cancelRename} className="text-text-3 hover:text-text p-0.5">
            <X size={13} />
          </button>
        </div>
      ) : (
        /* ── Обычный режим ── */
        <>
          <button
            onClick={onSelect}
            className="flex-1 text-left px-3 py-2.5 min-w-0"
          >
            <p className="text-[12.5px] font-medium truncate">{session.title}</p>
            <p className="text-[11px] text-text-3 mt-0.5">
              {new Date(session.updatedAt).toLocaleDateString('ru-RU')}
            </p>
          </button>

          {/* Кнопки — показываем при hover или активной сессии */}
          <div className={cn(
            'flex items-center gap-0.5 pr-1.5 flex-shrink-0 transition-opacity',
            hovered || active ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true) }}
              title="Переименовать"
              className="p-1 rounded text-text-3 hover:text-accent hover:bg-surface3 transition-colors"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); confirmDelete() }}
              disabled={deleting}
              title="Удалить чат"
              className="p-1 rounded text-text-3 hover:text-red-400 hover:bg-surface3 transition-colors disabled:opacity-40"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
