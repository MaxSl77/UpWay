import { TopBar } from '@/components/layout/TopBar'
import { NextStepCard } from '@/features/dashboard/components/NextStepCard'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { RoadmapSummaryCard } from '@/features/dashboard/components/RoadmapSummaryCard'
import { UpcomingEventsCard } from '@/features/dashboard/components/UpcomingEventsCard'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { format } from 'date-fns'
import { ru, enUS } from 'date-fns/locale'

export default function DashboardPage() {
  const { player, metrics, nextStep, roadmapItems, events, isLoading } = useDashboard()
  const user = useAuthStore((s) => s.user)
  const { language } = useSettingsStore()

  if (isLoading) return <FullPageSpinner />

  const firstName = user?.fullName?.split(' ')[0] ?? (language === 'ru' ? 'родитель' : 'friend')
  const hour = new Date().getHours()

  const greeting = language === 'ru'
    ? hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'
    : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const dateStr = language === 'ru'
    ? format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })
    : format(new Date(), 'EEEE, MMMM d, yyyy', { locale: enUS })

  const t = {
    goalProgress: language === 'ru' ? 'Прогресс к цели'      : 'Goal Progress',
    goalCtx: (label: string, months: number) =>
      language === 'ru'
        ? `Цель: ${label} · ещё ${months} мес. · на основе самооценки`
        : `Goal: ${label} · ${months} mo. left · based on self-assessment`,
    skating:    language === 'ru' ? 'Катание'                 : 'Skating',
    skatingCtx: (delta: number) =>
      language === 'ru'
        ? `Самооценка навыка · ${delta > 0 ? `+${delta}` : delta} за месяц`
        : `Self-assessed skill · ${delta > 0 ? `+${delta}` : delta} this month`,
    growth:     language === 'ru' ? '↑ В росте'              : '↑ Improving',
    goalProb:   language === 'ru' ? 'Вероятность цели'        : 'Goal Probability',
    probCtx:    language === 'ru' ? 'На основе вашей самооценки навыков' : 'Based on your self-assessed skills',
    updated:    (date: string) =>
      language === 'ru' ? `Обновлено ${date}` : `Updated ${date}`,
  }

  return (
    <>
      <TopBar
        title={`${greeting}, ${firstName} 👋`}
        subtitle={dateStr}
      />

      <div className="flex-1 overflow-y-auto px-7 py-6 pb-16 scrollbar-thin">
        <div className="flex flex-col gap-4">
          {nextStep && <NextStepCard step={nextStep} />}

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label={t.goalProgress}
              value={`${metrics?.goalProgressPct ?? 0}%`}
              context={t.goalCtx(metrics?.goalLabel ?? '—', metrics?.monthsRemaining ?? 0)}
              progress={metrics?.goalProgressPct}
              accent
            />
            <MetricCard
              label={t.skating}
              value={`${metrics?.skatingScore ?? 0}`}
              suffix="/10"
              context={t.skatingCtx(metrics?.skatingDelta ?? 0)}
              badges={[
                { label: t.growth, variant: 'green' },
                { label: player?.level ?? '—', variant: 'gray' },
              ]}
            />
            <MetricCard
              label={t.goalProb}
              value={`${metrics?.goalProbabilityPct ?? 0}%`}
              context={t.probCtx}
              badges={[{ label: t.updated(metrics?.probabilityUpdatedAt ?? '—'), variant: 'orange' }]}
              orange
            />
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-[1.6fr_1fr] gap-4">
            <RoadmapSummaryCard items={roadmapItems ?? []} />
            <UpcomingEventsCard events={events ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}
