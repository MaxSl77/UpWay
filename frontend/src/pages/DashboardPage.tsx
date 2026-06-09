import { TopBar } from '@/components/layout/TopBar'
import { NextStepCard } from '@/features/dashboard/components/NextStepCard'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { RoadmapSummaryCard } from '@/features/dashboard/components/RoadmapSummaryCard'
import { UpcomingEventsCard } from '@/features/dashboard/components/UpcomingEventsCard'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function DashboardPage() {
  const { player, metrics, nextStep, roadmapItems, events, isLoading } = useDashboard()
  const user = useAuthStore((s) => s.user)

  if (isLoading) return <FullPageSpinner />

  // Greeting uses the parent's name (user account), not the player name
  const firstName = user?.fullName?.split(' ')[0] ?? 'родитель'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  return (
    <>
      <TopBar
        title={`${greeting}, ${firstName} 👋`}
        subtitle={format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
      />

      <div className="flex-1 overflow-y-auto px-7 py-6 pb-16 scrollbar-thin">
        <div className="flex flex-col gap-4">
          {nextStep && <NextStepCard step={nextStep} />}

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Прогресс к цели"
              value={`${metrics?.goalProgressPct ?? 0}%`}
              context={`Цель: ${metrics?.goalLabel ?? '—'} · ещё ${metrics?.monthsRemaining ?? '—'} мес. · на основе самооценки`}
              progress={metrics?.goalProgressPct}
              accent
            />
            <MetricCard
              label="Катание"
              value={`${metrics?.skatingScore ?? 0}`}
              suffix="/10"
              context={`Самооценка навыка · ${metrics?.skatingDelta && metrics.skatingDelta > 0 ? `+${metrics.skatingDelta}` : metrics?.skatingDelta ?? 0} за месяц`}
              badges={[
                { label: '↑ В росте', variant: 'green' },
                { label: player?.level ?? '—', variant: 'gray' },
              ]}
            />
            <MetricCard
              label="Вероятность цели"
              value={`${metrics?.goalProbabilityPct ?? 0}%`}
              context="На основе вашей самооценки навыков"
              badges={[{ label: `Обновлено ${metrics?.probabilityUpdatedAt ?? '—'}`, variant: 'orange' }]}
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
