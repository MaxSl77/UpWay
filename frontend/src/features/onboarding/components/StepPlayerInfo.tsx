import type { Player } from '@/types'

type FormData = Partial<Omit<Player, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
interface Props { data: FormData; onChange: (d: FormData) => void; errors?: Record<string, string> }

const positions = [
  { value: 'forward',    label: 'Нападающий',  icon: '⚡' },
  { value: 'defenseman', label: 'Защитник',     icon: '🛡️' },
  { value: 'goaltender', label: 'Вратарь',      icon: '🥅' },
]

const nameRegex = /^[a-zA-Zа-яёА-ЯЁ\s-]*$/

export function StepPlayerInfo({ data, onChange, errors = {} }: Props) {
  const numField = (key: 'age' | 'heightCm' | 'weightKg') => ({
    value: data[key] !== undefined && data[key] !== 0 ? String(data[key]) : '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      onChange({ [key]: v === '' ? undefined : Number(v) })
    },
  })

  const inputCls = (errKey: string) =>
    `w-full h-11 px-3.5 bg-surface2 border rounded-btn text-sm text-text focus:outline-none transition-colors ${
      errors[errKey] ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'
    }`

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Имя игрока</label>
        <input
          type="text"
          value={(data.name as string) ?? ''}
          onChange={(e) => {
            if (nameRegex.test(e.target.value)) onChange({ name: e.target.value })
          }}
          placeholder="Артём Морозов"
          maxLength={50}
          className={inputCls('name')}
        />
        {errors.name && <p className="text-danger text-[11.5px] mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Возраст</label>
          <input
            type="number" {...numField('age')} placeholder="14" min={5} max={45}
            className={inputCls('age')}
          />
          {errors.age && <p className="text-danger text-[11.5px] mt-1">{errors.age}</p>}
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Рост (см)</label>
          <input
            type="number" {...numField('heightCm')} placeholder="170" min={100} max={220}
            className={inputCls('heightCm')}
          />
          {errors.heightCm && <p className="text-danger text-[11.5px] mt-1">{errors.heightCm}</p>}
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Вес (кг)</label>
          <input
            type="number" {...numField('weightKg')} placeholder="65" min={30} max={130}
            className={inputCls('weightKg')}
          />
          {errors.weightKg && <p className="text-danger text-[11.5px] mt-1">{errors.weightKg}</p>}
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
                  : errors.position
                    ? 'border-danger bg-surface2 text-text-2'
                    : 'border-border bg-surface2 text-text-2 hover:border-accent/50'}`}
            >
              <span className="text-2xl">{p.icon}</span>
              <span className="text-[13px] font-semibold">{p.label}</span>
            </button>
          ))}
        </div>
        {errors.position && <p className="text-danger text-[11.5px] mt-1.5">{errors.position}</p>}
      </div>
    </div>
  )
}
