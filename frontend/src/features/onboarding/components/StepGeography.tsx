import type { Player } from '@/types'

type FormData = Partial<Omit<Player, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
interface Props { data: FormData; onChange: (d: FormData) => void }

const countries = ['Беларусь', 'Россия', 'Казахстан', 'Украина', 'Латвия', 'Чехия', 'Финляндия', 'Другая']

export function StepGeography({ data, onChange }: Props) {
  const text = (key: keyof FormData) => ({
    value: (data[key] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [key]: e.target.value }),
  })

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[12.5px] font-semibold text-text-2 mb-2 uppercase tracking-wide">Страна</label>
        <div className="flex flex-wrap gap-2">
          {countries.map((c) => (
            <button
              key={c} type="button"
              onClick={() => onChange({ country: c })}
              className={`h-9 px-4 rounded-full border text-[13px] font-medium transition-all
                ${data.country === c
                  ? 'border-accent bg-accent-dim text-accent'
                  : 'border-border bg-surface2 text-text-2 hover:border-accent/50 hover:text-text'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Город</label>
          <input
            type="text" {...text('city')} placeholder="Минск"
            className="w-full h-11 px-3.5 bg-surface2 border border-border rounded-btn text-sm text-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Команда</label>
          <input
            type="text" {...text('team')} placeholder="Юниор Минск"
            className="w-full h-11 px-3.5 bg-surface2 border border-border rounded-btn text-sm text-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Хоккейная школа</label>
        <input
          type="text" {...text('hockeySchool')} placeholder="СДЮШОР Юность"
          className="w-full h-11 px-3.5 bg-surface2 border border-border rounded-btn text-sm text-text focus:outline-none focus:border-accent transition-colors"
        />
      </div>
    </div>
  )
}
