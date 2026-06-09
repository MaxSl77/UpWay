import type { PlayerSkills } from '@/types'

const SKILL_META: { key: keyof PlayerSkills; label: string; icon: string }[] = [
  { key: 'skating',  label: 'Катание',          icon: '⛸' },
  { key: 'shooting', label: 'Бросок',           icon: '🏒' },
  { key: 'passing',  label: 'Пас',              icon: '🎯' },
  { key: 'fitness',  label: 'Физическая форма', icon: '💪' },
  { key: 'sense',    label: 'Хоккейный интеллект', icon: '🧠' },
]

interface Props {
  skills: PlayerSkills
}

export function SkillBars({ skills }: Props) {
  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-3">
          Навыки
        </h3>
        <span className="text-[11px] text-text-3">На основе самооценки</span>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {SKILL_META.map(({ key, label, icon }) => {
          const score = skills?.[key] ?? 0
          const pct = (score / 10) * 100

          return (
            <div key={key} className="flex items-center gap-3 py-2.5">
              <div className="w-40 text-sm font-medium text-text flex-shrink-0">
                <span className="mr-1.5">{icon}</span>
                {label}
              </div>
              <div className="flex-1 h-[7px] bg-surface3 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #0f8a4a, #22d67a)',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <div className="w-8 text-right text-sm font-bold text-accent flex-shrink-0">
                {score}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
