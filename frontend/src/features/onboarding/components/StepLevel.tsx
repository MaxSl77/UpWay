import type { Player } from '@/types'

type FormData = Partial<Omit<Player, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
interface Props { data: FormData; onChange: (d: FormData) => void }

const levels = [
  { value: 'amateur',      label: 'Любитель',          sub: 'Дворовый / школьный хоккей' },
  { value: 'dyussh',       label: 'ДЮСШ',              sub: 'Детско-юношеская спортшкола' },
  { value: 'sdyushor',     label: 'СДЮШОР / Академия', sub: 'Специализированная школа' },
  { value: 'national',     label: 'Национальная лига',  sub: 'МХЛ, ВХЛ, Экстралига' },
  { value: 'professional', label: 'КХЛ / Профи',        sub: 'Высший уровень' },
]

export function StepLevel({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      {levels.map((l) => (
        <button
          key={l.value} type="button"
          onClick={() => onChange({ level: l.value as Player['level'] })}
          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 text-left transition-all
            ${data.level === l.value
              ? 'border-accent bg-accent-dim shadow-[0_0_0_4px_rgba(34,214,122,0.08)]'
              : 'border-border bg-surface2 hover:border-accent/40'}`}
        >
          <div>
            <p className={`text-[14px] font-semibold ${data.level === l.value ? 'text-accent' : 'text-text'}`}>
              {l.label}
            </p>
            <p className="text-[12px] text-text-3 mt-0.5">{l.sub}</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${data.level === l.value ? 'border-accent bg-accent' : 'border-border'}`}>
            {data.level === l.value && <div className="w-2 h-2 rounded-full bg-[#0a1a11]" />}
          </div>
        </button>
      ))}
    </div>
  )
}
