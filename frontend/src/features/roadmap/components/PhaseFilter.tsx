import { cn } from '@/lib/utils'
import type { RoadmapItem } from '@/types'

interface Props {
  phases: string[]
  allItems: RoadmapItem[]
  active: string | null
  onChange: (phase: string | null) => void
}

export function PhaseFilter({ phases, allItems, active, onChange }: Props) {
  const countForPhase = (phase: string) =>
    allItems.filter((i) => i.phase === phase).length

  const pillCls = (selected: boolean) =>
    cn(
      'h-8 px-3.5 rounded-full text-[12.5px] font-medium border transition-all flex items-center gap-2',
      selected
        ? 'bg-accent-dim border-accent text-accent'
        : 'bg-surface2 border-border text-text-2 hover:border-text-3 hover:text-text',
    )

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <button className={pillCls(active === null)} onClick={() => onChange(null)}>
        Все фазы
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
          active === null ? 'bg-accent text-[#0a1a11]' : 'bg-surface3 text-text-2',
        )}>
          {allItems.length}
        </span>
      </button>

      {phases.map((phase) => (
        <button
          key={phase}
          className={pillCls(active === phase)}
          onClick={() => onChange(active === phase ? null : phase)}
        >
          {phase}
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
            active === phase ? 'bg-accent text-[#0a1a11]' : 'bg-surface3 text-text-2',
          )}>
            {countForPhase(phase)}
          </span>
        </button>
      ))}
    </div>
  )
}
