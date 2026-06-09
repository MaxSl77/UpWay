import { cn } from '@/lib/utils'
import type { RoadmapItem, RoadmapItemStatus } from '@/types'

const STATUS_DOT: Record<RoadmapItemStatus, { bg: string; text: string; label: string }> = {
  done:   { bg: 'bg-accent-dim border-accent',   text: 'text-accent',   label: '✓' },
  active: { bg: 'bg-accent border-accent',        text: 'text-[#0a1a11]', label: 'NOW' },
  todo:   { bg: 'bg-surface3 border-border',      text: 'text-text-3',   label: '' },
}

const STATUS_TAG: Record<RoadmapItemStatus, { cls: string; label: string }> = {
  done:   { cls: 'bg-accent-dim text-accent',   label: '✓ Выполнено' },
  active: { cls: 'bg-orange-dim text-orange',   label: '⏳ В процессе' },
  todo:   { cls: 'bg-surface3 text-text-2',     label: 'Запланировано' },
}

interface Props {
  items: RoadmapItem[]
  isLoading: boolean
  onStatusChange: (id: string, status: RoadmapItemStatus) => void
}

export function RoadmapTimeline({ items, isLoading, onStatusChange }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-surface3" />
              <div className="w-px flex-1 bg-surface3 mt-2" />
            </div>
            <div className="flex-1 pb-8">
              <div className="h-3 bg-surface3 rounded w-32 mb-3" />
              <div className="h-4 bg-surface3 rounded w-64 mb-2" />
              <div className="h-3 bg-surface3 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="text-4xl">🗺️</div>
        <p className="text-sm font-medium text-text-2">Роадмап ещё генерируется</p>
        <p className="text-xs text-text-3">AI составляет персональный план. Обычно это занимает менее минуты.</p>
      </div>
    )
  }

  const NEXT_STATUS: Record<RoadmapItemStatus, RoadmapItemStatus> = {
    todo:   'active',
    active: 'done',
    done:   'todo',
  }

  return (
    <div className="flex flex-col">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        const dot = STATUS_DOT[item.status]
        const tag = STATUS_TAG[item.status]
        const sortLabel = item.status === 'todo' ? String(idx + 1) : dot.label

        return (
          <div key={item.id} className="flex gap-4 group">
            {/* Dot + vertical line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <button
                onClick={() => onStatusChange(item.id, NEXT_STATUS[item.status])}
                title="Изменить статус"
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center',
                  'text-[11px] font-bold flex-shrink-0 transition-all hover:scale-110',
                  dot.bg, dot.text,
                  item.status === 'active' && 'shadow-accent',
                )}
              >
                {sortLabel}
              </button>
              {!isLast && (
                <div className={cn(
                  'w-px flex-1 mt-1 mb-0',
                  item.status === 'done' ? 'bg-accent/40' : 'bg-border',
                )} style={{ minHeight: '32px' }} />
              )}
            </div>

            {/* Content */}
            <div className={cn('flex-1 pb-7', isLast && 'pb-2')}>
              {/* Phase + date */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] text-text-3 font-medium">{item.phase}</span>
                {item.targetDate && (
                  <>
                    <span className="text-text-3 text-[10px]">·</span>
                    <span className="text-[11px] text-text-3">
                      {new Date(item.targetDate + 'T12:00:00').toLocaleDateString('ru-RU', {
                        month: 'long', year: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h3 className={cn(
                'text-[14.5px] font-semibold leading-snug mb-1.5',
                item.status === 'done' ? 'text-text-2 line-through decoration-text-3' : 'text-text',
              )}>
                {item.title}
              </h3>

              {/* Description */}
              {item.description && (
                <p className="text-[13px] text-text-2 leading-relaxed mb-2.5">
                  {item.description}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', tag.cls)}>
                  {tag.label}
                </span>
                {item.tags?.map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-surface3 text-text-2">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
