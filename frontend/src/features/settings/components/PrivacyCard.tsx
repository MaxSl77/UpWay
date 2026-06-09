import { ShieldCheck, ExternalLink, FileText } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'

export function PrivacyCard() {
  const { language } = useSettingsStore()

  const t = {
    title:         language === 'ru' ? 'Конфиденциальность' : 'Privacy & Policy',
    description:   language === 'ru'
      ? 'UpWay собирает данные об игроке и использует их исключительно для персонализации AI-рекомендаций. Мы не передаём данные третьим лицам.'
      : 'UpWay collects player data and uses it solely for personalizing AI recommendations. We do not share data with third parties.',
    privacyPolicy: language === 'ru' ? 'Политика конфиденциальности' : 'Privacy Policy',
    termsOfUse:    language === 'ru' ? 'Условия использования'       : 'Terms of Use',
    dataUsage:     language === 'ru' ? 'Использование данных'        : 'Data Usage',
    version:       language === 'ru' ? 'Версия приложения'           : 'App version',
    versionNum:    '0.1.0-beta',
    collected:     language === 'ru'
      ? ['Профиль игрока', 'История чата', 'Настройки приложения']
      : ['Player profile', 'Chat history', 'App settings'],
    notCollected:  language === 'ru'
      ? 'Финансовые данные не хранятся на наших серверах.'
      : 'Financial data is not stored on our servers.',
  }

  const links = [
    { label: t.privacyPolicy, icon: ShieldCheck },
    { label: t.termsOfUse,    icon: FileText },
  ]

  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center">
          <ShieldCheck size={15} className="text-accent" />
        </div>
        <span className="font-semibold text-[14px]">{t.title}</span>
      </div>

      {/* Description */}
      <p className="text-[12.5px] text-text-2 leading-relaxed mb-4">{t.description}</p>

      {/* Collected data */}
      <div className="bg-surface2 rounded-btn p-3 mb-4">
        <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-2">{t.dataUsage}</p>
        <ul className="flex flex-col gap-1">
          {t.collected.map((item) => (
            <li key={item} className="flex items-center gap-2 text-[12.5px] text-text-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[11.5px] text-text-3 mt-2 pt-2 border-t border-border">{t.notCollected}</p>
      </div>

      {/* Links */}
      <div className="flex flex-col gap-2 mb-4">
        {links.map(({ label, icon: Icon }) => (
          <a
            key={label}
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center justify-between h-9 px-3 rounded-btn bg-surface2 border border-border text-[13px] text-text-2 hover:text-text hover:border-text-3 transition-all group"
          >
            <span className="flex items-center gap-2">
              <Icon size={13} className="text-text-3" />
              {label}
            </span>
            <ExternalLink size={12} className="text-text-3 group-hover:text-text-2 transition-colors" />
          </a>
        ))}
      </div>

      {/* Version */}
      <div className="flex items-center justify-between text-[11px] text-text-3">
        <span>{t.version}</span>
        <span className="font-mono">{t.versionNum}</span>
      </div>
    </div>
  )
}
