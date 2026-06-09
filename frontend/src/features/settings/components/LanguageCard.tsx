import { Globe } from 'lucide-react'
import { useSettingsStore, type Language, type Currency } from '@/store/settingsStore'

const LANGUAGES: { id: Language; label: string; flag: string }[] = [
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'en', label: 'English', flag: '🇺🇸' },
]

const CURRENCIES_RU: { id: Currency; label: string; symbol: string }[] = [
  { id: 'rub', label: 'Российский рубль', symbol: '₽' },
  { id: 'byn', label: 'Белорусский рубль', symbol: 'Br' },
]

const CURRENCIES_EN: { id: Currency; label: string; symbol: string }[] = [
  { id: 'usd', label: 'US Dollar', symbol: '$' },
]

export function LanguageCard() {
  const { language, currency, setLanguage, setCurrency } = useSettingsStore()

  const currencies  = language === 'en' ? CURRENCIES_EN : CURRENCIES_RU
  const title       = language === 'ru' ? 'Язык и валюта' : 'Language & Currency'
  const langLabel   = language === 'ru' ? 'Язык интерфейса' : 'Interface language'
  const currLabel   = language === 'ru' ? 'Валюта' : 'Currency'

  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center">
          <Globe size={15} className="text-accent" />
        </div>
        <span className="font-semibold text-[14px]">{title}</span>
      </div>

      <div className="mb-4">
        <p className="text-[12px] text-text-2 mb-2">{langLabel}</p>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => setLanguage(l.id)}
              className={[
                'flex items-center gap-2 h-10 px-3 rounded-btn border text-[13px] font-medium transition-all',
                language === l.id
                  ? 'bg-accent-dim border-accent text-accent'
                  : 'bg-surface2 border-border text-text-2 hover:border-text-3 hover:text-text',
              ].join(' ')}
            >
              <span className="text-base">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[12px] text-text-2 mb-2">{currLabel}</p>
        <div className="flex flex-col gap-2">
          {currencies.map((c) => (
            <button
              key={c.id}
              onClick={() => setCurrency(c.id)}
              className={[
                'flex items-center justify-between h-10 px-3 rounded-btn border text-[13px] transition-all',
                currency === c.id
                  ? 'bg-accent-dim border-accent text-accent font-medium'
                  : 'bg-surface2 border-border text-text-2 hover:border-text-3 hover:text-text',
              ].join(' ')}
            >
              <span>{c.label}</span>
              <span className="font-bold">{c.symbol}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
