import type { Player } from '@/types'
import { CityInput } from './CityInput'
import { isAllowedPlaceNameInput } from '@/lib/validation'

type FormData = Partial<Omit<Player, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
interface Props {
  data: FormData
  onChange: (d: FormData) => void
  errors?: Record<string, string>
  onCityValidated?: (valid: boolean) => void
}

const countries = ['Беларусь', 'Россия', 'Казахстан', 'Украина', 'Латвия', 'Чехия', 'Финляндия', 'Другая']

export function StepGeography({ data, onChange, errors = {}, onCityValidated }: Props) {
  const textField = (key: keyof FormData) => ({
    value: (data[key] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      // Посимвольный фильтр: ссылки и спецсимволы не вводятся вовсе
      if (isAllowedPlaceNameInput(e.target.value)) onChange({ [key]: e.target.value })
    },
  })

  const inputCls = (errKey: string) =>
    `w-full h-11 px-3.5 bg-surface2 border rounded-btn text-sm text-text focus:outline-none transition-colors ${
      errors[errKey] ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'
    }`

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
                  : errors.country
                    ? 'border-danger bg-surface2 text-text-2 hover:border-danger/70'
                    : 'border-border bg-surface2 text-text-2 hover:border-accent/50 hover:text-text'}`}
            >
              {c}
            </button>
          ))}
        </div>
        {errors.country && <p className="text-danger text-[11.5px] mt-1.5">{errors.country}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">Город</label>
          <CityInput
            value={(data.city as string) ?? ''}
            onChange={(city, valid) => {
              onChange({ city })
              onCityValidated?.(valid)
            }}
            error={errors.city}
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">
            Команда <span className="text-text-3 normal-case font-normal">(необязательно)</span>
          </label>
          <input
            type="text" {...textField('team')} placeholder="Юниор Минск" maxLength={60}
            className={inputCls('team')}
          />
        </div>
      </div>

      <div>
        <label className="block text-[12.5px] font-semibold text-text-2 mb-1.5 uppercase tracking-wide">
          Хоккейная школа <span className="text-text-3 normal-case font-normal">(необязательно)</span>
        </label>
        <input
          type="text" {...textField('hockeySchool')} placeholder="СДЮШОР Юность" maxLength={60}
          className={inputCls('hockeySchool')}
        />
      </div>
    </div>
  )
}
