import { TopBar } from '@/components/layout/TopBar'
import { NotificationsCard } from '@/features/settings/components/NotificationsCard'
import { LanguageCard } from '@/features/settings/components/LanguageCard'
import { SecurityCard } from '@/features/settings/components/SecurityCard'
import { DangerZoneCard } from '@/features/settings/components/DangerZoneCard'
import { ThemeCard } from '@/features/settings/components/ThemeCard'
import { PrivacyCard } from '@/features/settings/components/PrivacyCard'
import { useSettingsStore } from '@/store/settingsStore'

export default function SettingsPage() {
  const language = useSettingsStore((s) => s.language)
  const title    = language === 'ru' ? 'Настройки' : 'Settings'

  return (
    <>
      <TopBar title={title} />
      <div className="flex-1 overflow-y-auto px-7 py-6 pb-16 scrollbar-thin">
        {/* Row 1: Language + Theme */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <LanguageCard />
          <ThemeCard />
        </div>
        {/* Row 2: Notifications + Security */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <NotificationsCard />
          <SecurityCard />
        </div>
        {/* Row 3: Privacy + Danger */}
        <div className="grid grid-cols-2 gap-5">
          <PrivacyCard />
          <DangerZoneCard />
        </div>
      </div>
    </>
  )
}
