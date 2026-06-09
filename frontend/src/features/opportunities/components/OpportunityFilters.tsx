import { cn } from '@/lib/utils'
import type { OppType } from '@/types'

type Filter = OppType | 'all'

interface FilterOption {
  id: Filter
  label: string
  icon: string
}

const OPTIONS: FilterOption[] = [
  { id: 'all',        label: 'Все',       icon: '◈' },
  { id: 'camp',       label: 'Лагеря',    icon: '🏕' },
  { id: 'tryout',     label: 'Просмотры', icon: '🥊' },
  { id: 'tournament', label: 'Турниры',   icon: '🏆' },
]

interface Props {
  active: Filter
  onChange: (f: Filter) => void
}

export function OpportunityFilters({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 mb-5 flex-wrap">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            'h-9 px-4 rounded-btn text-[13px] font-medium border transition-all flex items-center gap-2',
            active === opt.id
              ? 'bg-accent-dim border-accent text-accent'
              : 'bg-surface2 border-border text-text-2 hover:border-text-3 hover:text-text',
          )}
        >
          <span>{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  )
}
