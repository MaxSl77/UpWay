import type { Player } from '@/types'

interface Props {
  player: Player
}

export function GoalsCard({ player }: Props) {
  const [primary, ...secondary] = player.goals ?? []

  const skills = player.skills ?? {}
  const skillValues = Object.values(skills) as number[]
  const skillsAbove6 = skillValues.filter((v) => v >= 6).length
  const progress = skillValues.length
    ? Math.round((skillsAbove6 / skillValues.length) * 100)
    : 0

  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-3 mb-4">
        Цели
      </h3>

      {primary ? (
        <>
          <div className="mb-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-1.5">
              Основная цель
            </div>
            <div className="font-display text-xl font-extrabold text-text">{primary}</div>
            <div className="text-xs text-text-2 mt-1">
              {player.age} лет · осталось ~{Math.max(0, (18 - player.age) * 12)} мес.
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-text-2 mb-1.5">
              <span>Прогресс</span>
              <span className="font-bold text-accent">{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${progress}%`, transition: 'width 0.6s ease' }}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-text-2">Цели не заданы</p>
      )}

      {secondary.length > 0 && (
        <div className="mt-5">
          <div className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-2.5">
            Дополнительные цели
          </div>
          <div className="flex flex-col gap-1.5">
            {secondary.map((g) => (
              <div
                key={g}
                className="rounded-md px-3 py-1.5 text-sm text-text-2 bg-surface3"
              >
                {g}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
