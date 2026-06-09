import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { RoadmapItem } from '@/types'

export function RoadmapSummaryCard({ items }: { items: RoadmapItem[] }) {
  const navigate = useNavigate()

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h4 className="font-display text-sm font-bold">Roadmap · Phase 1: Foundation</h4>
        <button
          onClick={() => navigate('/roadmap')}
          className="h-8 px-4 bg-surface2 border border-border rounded-btn text-[13px] hover:border-accent hover:text-accent transition-colors"
        >
          View full →
        </button>
      </div>
      <div className="px-5 py-4">
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex gap-3.5 py-2.5 border-b border-border last:border-0">
            <div
              className={cn(
                'w-[26px] h-[26px] rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold',
                item.status === 'done'   && 'bg-accent-dim text-accent',
                item.status === 'active' && 'bg-accent text-[#0a1a11]',
                item.status === 'todo'   && 'bg-surface3 text-text-3',
              )}
            >
              {item.status === 'done' ? '✓' : item.phaseNumber}
            </div>
            <div>
              <p className="text-[13px] font-medium">{item.title}</p>
              <p className={cn(
                'text-[11.5px] mt-0.5',
                item.status === 'active' ? 'text-accent' : 'text-text-2',
              )}>
                {item.targetDate ?? item.completedDate ?? ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
