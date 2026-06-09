import type { Player } from '@/types'

interface StatBoxProps {
  value: string
  unit?: string
  label: string
  accent?: boolean
}

function StatBox({ value, unit, label, accent }: StatBoxProps) {
  return (
    <div className="bg-surface border border-border rounded-card p-4">
      <div className="font-display text-[22px] font-extrabold leading-none" style={{ color: accent ? 'var(--color-accent)' : 'var(--color-text)' }}>
        {value}
        {unit && (
          <span className="text-sm font-normal text-text-3 ml-1">{unit}</span>
        )}
      </div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest text-text-3">
        {label}
      </div>
    </div>
  )
}

interface Props {
  player: Player
}

export function ProfileStats({ player }: Props) {
  const skills = player.skills ?? {}
  const skillValues = Object.values(skills) as number[]
  const avgSkill = skillValues.length
    ? (skillValues.reduce((a, b) => a + b, 0) / skillValues.length).toFixed(1)
    : '—'

  const skillsAbove6 = skillValues.filter((v) => v >= 6).length
  const goalProgress = skillValues.length
    ? Math.round((skillsAbove6 / skillValues.length) * 100)
    : 0

  return (
    <div className="grid grid-cols-4 gap-3">
      <StatBox value={String(player.heightCm)} unit="см" label="Рост" />
      <StatBox value={String(player.weightKg)} unit="кг" label="Вес" />
      <StatBox value={`${goalProgress}%`} label="Прогресс к цели" accent />
      <StatBox value={String(avgSkill)} unit="/10" label="Средний навык" accent />
    </div>
  )
}
