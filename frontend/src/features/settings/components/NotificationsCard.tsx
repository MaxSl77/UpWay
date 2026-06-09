import { Bell } from 'lucide-react'
import { useSettingsStore, type NotificationSettings } from '@/store/settingsStore'

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="pr-4">
        <p className="text-[13px] font-medium">{label}</p>
        <p className="text-[11px] text-text-2 mt-0.5">{description}</p>
      </div>
      {/* Toggle — uses left positioning to avoid translate-x issues */}
      <button
        type="button"
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        className={[
          'relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200',
          checked ? 'bg-accent' : 'bg-surface3',
        ].join(' ')}
      >
        <span
          className="absolute top-[2px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: checked ? '22px' : '2px' }}
        />
      </button>
    </div>
  )
}

export function NotificationsCard() {
  const { notifications, toggleNotification, language } = useSettingsStore()

  const title = language === 'ru' ? 'Уведомления' : 'Notifications'

  const rows: {
    key: keyof NotificationSettings
    labelRu: string; labelEn: string
    descRu: string;  descEn: string
  }[] = [
    {
      key: 'emailRoadmap',
      labelRu: 'Обновления роадмапа',  labelEn: 'Roadmap updates',
      descRu:  'Когда AI добавляет новые этапы', descEn: 'When AI adds new milestones',
    },
    {
      key: 'emailOpportunities',
      labelRu: 'Новые возможности',    labelEn: 'New opportunities',
      descRu:  'Лагеря, турниры и просмотры',    descEn: 'Camps, tournaments and tryouts',
    },
    {
      key: 'emailWeeklyReport',
      labelRu: 'Еженедельный отчёт',   labelEn: 'Weekly report',
      descRu:  'Сводка прогресса каждую неделю', descEn: 'Weekly progress summary',
    },
    {
      key: 'pushAlerts',
      labelRu: 'Push-уведомления',     labelEn: 'Push alerts',
      descRu:  'Срочные дедлайны и напоминания', descEn: 'Urgent deadlines and reminders',
    },
  ]

  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center">
          <Bell size={15} className="text-accent" />
        </div>
        <span className="font-semibold text-[14px]">{title}</span>
      </div>

      <div>
        {rows.map((row) => (
          <ToggleRow
            key={row.key}
            label={language === 'ru' ? row.labelRu : row.labelEn}
            description={language === 'ru' ? row.descRu : row.descEn}
            checked={notifications[row.key]}
            onChange={() => toggleNotification(row.key)}
          />
        ))}
      </div>
    </div>
  )
}
