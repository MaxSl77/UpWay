import { TopBar } from '@/components/layout/TopBar'
import { RoadmapTimeline } from '@/features/roadmap/components/RoadmapTimeline'
import { PhaseFilter } from '@/features/roadmap/components/PhaseFilter'
import { useRoadmap } from '@/features/roadmap/hooks/useRoadmap'
import { usePlayerStore } from '@/store/playerStore'

export default function RoadmapPage() {
  const { phases, allItems, items, activePhase, setActivePhase, isLoading, updateStatus } = useRoadmap()
  const player = usePlayerStore((s) => s.player)

  const done   = allItems.filter((i) => i.status === 'done').length
  const total  = allItems.length
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0

  const primaryGoal = player?.goals?.[0] ?? '—'

  // AI insight: pick most relevant active item
  const activeItem = allItems.find((i) => i.status === 'active')

  return (
    <>
      <TopBar
        title="Career Roadmap"
        subtitle={`${primaryGoal} · ${done} из ${total} этапов выполнено`}
      />

      <div className="flex-1 overflow-y-auto px-7 py-6 pb-16 scrollbar-thin">
        <PhaseFilter
          phases={phases}
          allItems={allItems}
          active={activePhase}
          onChange={setActivePhase}
        />

        <div className="grid grid-cols-[1fr_300px] gap-6">
          {/* Timeline */}
          <RoadmapTimeline
            items={items}
            isLoading={isLoading}
            onStatusChange={updateStatus}
          />

          {/* Sidebar */}
          <div className="flex flex-col gap-3">
            {/* Overall progress */}
            <div className="bg-surface border border-border rounded-card p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-2">
                Общий прогресс
              </p>
              <p className="font-display text-3xl font-extrabold text-accent leading-none mb-2">
                {pct}%
              </p>
              <div className="h-1.5 bg-surface3 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11.5px] text-text-2">
                {done} из {total} этапов выполнено
              </p>
            </div>

            {/* Goal probability */}
            <div className="bg-surface border border-border rounded-card p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-2">
                Вероятность цели
              </p>
              <p className="font-display text-3xl font-extrabold text-orange leading-none mb-1">
                {pct > 50 ? Math.min(95, 45 + pct) : Math.max(20, pct + 20)}%
              </p>
              <p className="text-[11.5px] text-text-2">
                {pct > 60 ? 'Высокая · на верном пути' : pct > 30 ? 'Средняя · продолжайте' : 'Начальная · больше действий'}
              </p>
            </div>

            {/* Active step */}
            {activeItem && (
              <div className="bg-surface border border-border rounded-card p-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-2">
                  Текущий этап
                </p>
                <p className="text-[13.5px] font-semibold text-text leading-snug mb-1.5">
                  {activeItem.title}
                </p>
                {activeItem.description && (
                  <p className="text-[12px] text-text-2 leading-relaxed">
                    {activeItem.description}
                  </p>
                )}
                {activeItem.targetDate && (
                  <p className="text-[11px] text-orange mt-2 font-medium">
                    Цель:{' '}
                    {new Date(activeItem.targetDate + 'T12:00:00').toLocaleDateString('ru-RU', {
                      month: 'long', year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}

            {/* Phase breakdown */}
            {phases.length > 0 && (
              <div className="bg-surface border border-border rounded-card p-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-3">
                  По фазам
                </p>
                <div className="flex flex-col gap-2.5">
                  {phases.map((phase) => {
                    const phaseItems = allItems.filter((i) => i.phase === phase)
                    const phaseDone  = phaseItems.filter((i) => i.status === 'done').length
                    const phasePct   = phaseItems.length > 0
                      ? Math.round((phaseDone / phaseItems.length) * 100) : 0
                    return (
                      <div key={phase}>
                        <div className="flex justify-between text-[11.5px] mb-1">
                          <span className="text-text-2 truncate pr-2">{phase}</span>
                          <span className="text-accent font-semibold flex-shrink-0">{phasePct}%</span>
                        </div>
                        <div className="h-1 bg-surface3 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent transition-all duration-500"
                            style={{ width: `${phasePct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Hint */}
            <p className="text-[11px] text-text-3 text-center px-2">
              Нажмите на точку этапа чтобы изменить его статус
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
