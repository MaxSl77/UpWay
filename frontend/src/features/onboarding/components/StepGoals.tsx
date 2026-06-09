import type { Player } from '@/types'

type FormData = Partial<Omit<Player, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
interface Props { data: FormData; onChange: (d: FormData) => void }

const goalOptions = [
  { value: 'МХЛ',           icon: '🏒', desc: 'Молодёжная хоккейная лига' },
  { value: 'ВХЛ',           icon: '⬆️', desc: 'Высшая хоккейная лига' },
  { value: 'КХЛ',           icon: '🏆', desc: 'Континентальная хоккейная лига' },
  { value: 'НХЛ',           icon: '🌟', desc: 'Национальная хоккейная лига (НХЛ)' },
  { value: 'Экстралига',    icon: '🇧🇾', desc: 'Экстралига Беларуси' },
  { value: 'Академия',      icon: '🎓', desc: 'Поступить в хоккейную академию' },
  { value: 'Лагерь',        icon: '🏕️', desc: 'Участие в топ-лагерях развития' },
  { value: 'Просмотр',      icon: '👁️', desc: 'Пройти скаутский просмотр' },
]

export function StepGoals({ data, onChange }: Props) {
  const selected: string[] = data.goals ?? []

  const toggle = (val: string) => {
    const next = selected.includes(val)
      ? selected.filter((g) => g !== val)
      : [...selected, val]
    onChange({ goals: next })
  }

  return (
    <div>
      <p className="text-[13px] text-text-2 mb-4">Выберите одну или несколько целей — AI будет учитывать их при составлении плана.</p>
      <div className="grid grid-cols-2 gap-3">
        {goalOptions.map((g) => {
          const active = selected.includes(g.value)
          return (
            <button
              key={g.value} type="button"
              onClick={() => toggle(g.value)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all
                ${active
                  ? 'border-accent bg-accent-dim'
                  : 'border-border bg-surface2 hover:border-accent/40'}`}
            >
              <span className="text-xl mt-0.5">{g.icon}</span>
              <div>
                <p className={`text-[13.5px] font-bold ${active ? 'text-accent' : 'text-text'}`}>{g.value}</p>
                <p className="text-[11.5px] text-text-3 mt-0.5 leading-tight">{g.desc}</p>
              </div>
              {active && (
                <div className="ml-auto w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-[#0a1a11] text-[10px] font-black">✓</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
