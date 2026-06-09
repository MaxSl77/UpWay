import type { Player } from '@/types'

type FormData = Partial<Omit<Player, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
interface Props { data: FormData; onChange: (d: FormData) => void }

const positions = [
  { value: 'forward',    label: 'Нападающий',  icon: '⚡' },
  { value: 'defenseman', label: 'Защитник',     icon: '🛡️' },
  { value: 'goaltender', label: 'Вратарь',      icon: '🥅' },
]

export function StepPlayerInfo({ data, onChange }: Props) {
  const field = (key: keyof FormData) => ({
    value: (data[key] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ [key]: key === 'age' || key === 'heightCm' || key === 'weightKg'
        ? Number(e.target.value) : e.target.value }),
  })

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Имя игрока</label>
        <input
          type="text" {...field('name')} placeholder="Артём Морозов"
          className="w-full h-11 px-3.5 bg-surface2 border border-border rounded-btn text-sm text-text focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Возраст</label>
          <input
            type="number" {...field('age')} placeholder="14" min={5} max={25}
            className="w-full h-11 px-3.5 bg-surface2 border border-border rounded-btn text-sm text-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Рост (см)</label>
          <input
            type="number" {...field('heightCm')} placeholder="170" min={100} max={220}
            className="w-full h-11 px-3.5 bg-surface2 border border-border rounded-btn text-sm text-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Вес (кг)</label>
          <input
            type="number" {...field('weightKg')} placeholder="65" min={30} max={130}
            className="w-full h-11 px-3.5 bg-surface2 border border-border rounded-btn text-sm text-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12.5px] font-semibold text-text-2 mb-2 uppercase tracking-wide">Амплуа</label>
        <div className="grid grid-cols-3 gap-3">
          {positions.map((p) => (
            <button
              key={p.value} type="button"
              onClick={() => onChange({ position: p.value as Player['position'] })}
              className={`h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all
                ${data.position === p.value
                  ? 'border-accent bg-accent-dim text-accent shadow-[0_0_0_4px_rgba(34,214,122,0.1)]'
                  : 'border-border bg-surface2 text-text-2 hover:border-accent/50'}`}
            >
              <span className="text-2xl">{p.icon}</span>
              <span className="text-[13px] font-semibold">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
