import { cn } from '@/lib/utils'

interface Badge { label: string; variant: 'green' | 'orange' | 'gray' | 'blue' }

interface MetricCardProps {
  label: string
  value: string
  suffix?: string
  context?: string
  progress?: number
  badges?: Badge[]
  accent?: boolean
  orange?: boolean
}

export function MetricCard({ label, value, suffix, context, progress, badges, accent, orange }: MetricCardProps) {
  const valueColor = accent ? 'text-accent' : orange ? 'text-orange' : 'text-text'

  return (
    <div className="bg-surface border border-border rounded-card p-5 flex flex-col">
      <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-2.5">{label}</p>
      <p className={cn('text-[30px] font-extrabold leading-none mb-1', valueColor)}>
        {value}
        {suffix && <span className="text-base text-text-3 font-normal">{suffix}</span>}
      </p>
      {context && <p className="text-xs text-text-2">{context}</p>}

      {typeof progress === 'number' && (
        <div className="mt-2.5">
          <div className="h-1.5 bg-surface3 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {badges && badges.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {badges.map(({ label: bl, variant }) => (
            <span
              key={bl}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium',
                variant === 'green'  && 'bg-accent-dim text-accent',
                variant === 'orange' && 'bg-orange-dim text-orange',
                variant === 'gray'   && 'bg-surface3 text-text-2',
                variant === 'blue'   && 'bg-[rgba(74,159,255,0.12)] text-[#4a9fff]',
              )}
            >
              {bl}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
