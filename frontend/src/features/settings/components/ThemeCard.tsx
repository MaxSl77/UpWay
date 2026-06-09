import type { ReactNode } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useSettingsStore, type Theme } from '@/store/settingsStore'

export function ThemeCard() {
  const { theme, setTheme, language } = useSettingsStore()

  const title      = language === 'ru' ? 'Оформление' : 'Appearance'
  const themeLabel = language === 'ru' ? 'Тема интерфейса' : 'Interface theme'

  const themes: { id: Theme; label: string; labelRu: string; icon: ReactNode }[] = [
    {
      id: 'dark',
      label: 'Dark',
      labelRu: 'Тёмная',
      icon: <Moon size={15} />,
    },
    {
      id: 'light',
      label: 'Light',
      labelRu: 'Светлая',
      icon: <Sun size={15} />,
    },
  ]

  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center">
          {theme === 'dark' ? (
            <Moon size={15} className="text-accent" />
          ) : (
            <Sun size={15} className="text-accent" />
          )}
        </div>
        <span className="font-semibold text-[14px]">{title}</span>
      </div>

      <p className="text-[12px] text-text-2 mb-2">{themeLabel}</p>

      <div className="grid grid-cols-2 gap-2">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={[
              'flex flex-col items-center justify-center gap-2 h-20 rounded-btn border text-[13px] font-medium transition-all',
              theme === t.id
                ? 'bg-accent-dim border-accent text-accent'
                : 'bg-surface2 border-border text-text-2 hover:border-text-3 hover:text-text',
            ].join(' ')}
          >
            {/* Mini preview */}
            <div
              className={[
                'w-10 h-6 rounded-md border flex items-end overflow-hidden',
                t.id === 'dark'
                  ? 'bg-[#141720] border-[#2a2e40]'
                  : 'bg-[#ffffff] border-[#d0d6e8]',
              ].join(' ')}
            >
              <div
                className={[
                  'h-2 w-full',
                  t.id === 'dark' ? 'bg-[#22d67a]/20' : 'bg-[#16a85c]/15',
                ].join(' ')}
              />
            </div>
            <span>{language === 'ru' ? t.labelRu : t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
