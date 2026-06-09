import { useState, useEffect } from 'react'

// 280 chars fits exactly 4 lines (~70 chars/line) in the card at standard viewport,
// no scrollbar needed — text is fully visible at rest.
const MAX_CHARS = 280
const STORAGE_KEY = 'upway-player-bio'

export function NotesBioCard() {
  const [text, setText] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setText(saved)
  }, [])

  // Persist on every change
  const handleChange = (value: string) => {
    if (value.length > MAX_CHARS) return
    setText(value)
    localStorage.setItem(STORAGE_KEY, value)
  }

  const remaining = MAX_CHARS - text.length
  const isAlmostFull = remaining <= 40

  return (
    <div className="bg-surface border border-border rounded-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-3">
          Notes &amp; Bio
        </h3>
        {text.length > 0 && (
          <button
            onClick={() => handleChange('')}
            className="text-[11px] text-text-3 hover:text-danger transition-colors"
          >
            Очистить
          </button>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Заметки об игроке: особенности характера, тренерские наблюдения, важные события…"
        rows={4}
        className={[
          'w-full resize-none bg-surface2 border rounded-btn px-3 py-2.5',
          'text-sm text-text placeholder:text-text-3 outline-none transition-colors',
          'leading-relaxed scrollbar-thin',
          isFocused ? 'border-accent' : 'border-border',
        ].join(' ')}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[11px] text-text-3">
          Сохраняется автоматически
        </p>
        <p
          className={[
            'text-[11px] font-medium tabular-nums',
            isAlmostFull ? 'text-orange' : 'text-text-3',
          ].join(' ')}
        >
          {text.length} / {MAX_CHARS}
        </p>
      </div>
    </div>
  )
}
