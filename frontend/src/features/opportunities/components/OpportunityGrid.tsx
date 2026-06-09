import { cn } from '@/lib/utils'
import { usePlayerStore } from '@/store/playerStore'
import type { Opportunity, OppType } from '@/types'

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CFG: Record<OppType, { label: string; icon: string; accent: string; bar: string }> = {
  camp:       { label: 'Лагерь',    icon: '🏕', accent: 'text-accent border-accent bg-accent-dim',   bar: 'bg-accent' },
  tryout:     { label: 'Просмотр',  icon: '🥊', accent: 'text-[#4a9fff] border-[#4a9fff] bg-[rgba(74,159,255,0.12)]', bar: 'bg-[#4a9fff]' },
  tournament: { label: 'Турнир',    icon: '🏆', accent: 'text-orange border-orange bg-orange-dim',   bar: 'bg-orange' },
}

// Match % computed client-side from player profile vs opportunity tags/country
function computeMatch(opp: Opportunity, playerCountry?: string, playerPosition?: string): number {
  let score = 60
  if (playerCountry && opp.country.toLowerCase() === playerCountry.toLowerCase()) score += 15
  if (opp.isUrgent) score += 5
  const posMap: Record<string, string[]> = {
    forward:    ['форварды', 'нападающие', 'forwards', 'forward'],
    defenseman: ['защитники', 'defensemen', 'defenseman'],
    goaltender: ['вратари', 'goalies', 'goaltender'],
  }
  const posTags = playerPosition ? (posMap[playerPosition] ?? []) : []
  const tagLower = opp.tags.map((t) => t.toLowerCase())
  if (posTags.some((p) => tagLower.some((t) => t.includes(p)))) score += 10
  if (tagLower.some((t) => t.includes('все позиции') || t.includes('all positions'))) score += 5
  return Math.min(99, score)
}

function matchColor(pct: number) {
  if (pct >= 88) return 'bg-accent-dim text-accent'
  if (pct >= 75) return 'bg-orange-dim text-orange'
  return 'bg-surface3 text-text-2'
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

// ── Card ─────────────────────────────────────────────────────────────────────
function OppCard({ opp, match }: { opp: Opportunity; match: number }) {
  const type = opp.type as OppType
  const cfg  = TYPE_CFG[type] ?? TYPE_CFG.camp

  const days = opp.deadline ? daysUntil(opp.deadline) : null
  const isExpired = days !== null && days < 0
  const isUrgent  = opp.isUrgent || (days !== null && days >= 0 && days <= 7)

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden flex flex-col group hover:border-text-3 transition-colors">
      {/* Colour accent bar */}
      <div className={cn('h-1 w-full', cfg.bar)} />

      <div className="p-4 flex flex-col flex-1">
        {/* Top row: type + match */}
        <div className="flex items-center justify-between mb-2.5">
          <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium border', cfg.accent)}>
            {cfg.icon} {cfg.label}
          </span>
          <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-semibold', matchColor(match))}>
            ★ {match}% совпадение
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[14px] font-bold text-text leading-snug mb-1.5">
          {opp.title}
        </h3>

        {/* Location */}
        <p className="text-[12px] text-text-2 mb-2 flex items-center gap-1">
          📍 {opp.location}
        </p>

        {/* Description */}
        {opp.description && (
          <p className="text-[12px] text-text-2 leading-relaxed mb-3 line-clamp-2 flex-1">
            {opp.description}
          </p>
        )}

        {/* Tags */}
        {opp.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {opp.tags.slice(0, 4).map((t) => (
              <span key={t} className="text-[10.5px] px-2 py-0.5 rounded-full bg-surface3 text-text-2">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Footer: deadline + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          {opp.deadline ? (
            isExpired ? (
              <span className="text-[11.5px] text-text-3">Истёк дедлайн</span>
            ) : (
              <span className={cn('text-[11.5px] font-medium', isUrgent ? 'text-danger' : 'text-text-2')}>
                {isUrgent ? '⏰ ' : '📅 '}
                Дедлайн{' '}
                {new Date(opp.deadline + 'T12:00:00').toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'short',
                })}
                {days !== null && days >= 0 && days <= 14 && ` · ${days} дн.`}
              </span>
            )
          ) : (
            <span className="text-[11.5px] text-text-3">Без дедлайна</span>
          )}

          {opp.url ? (
            <a
              href={opp.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'h-7 px-3 rounded-btn text-[12px] font-semibold transition-all',
                isUrgent && !isExpired
                  ? 'bg-accent text-[#0a1a11] hover:brightness-110'
                  : 'bg-surface2 border border-border text-text-2 hover:border-accent hover:text-accent',
              )}
            >
              {isUrgent && !isExpired ? 'Подать заявку' : 'Подробнее'}
            </a>
          ) : (
            <button
              disabled
              className="h-7 px-3 rounded-btn text-[12px] font-medium bg-surface2 border border-border text-text-3 cursor-default"
            >
              Детали
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Grid ─────────────────────────────────────────────────────────────────────
interface Props {
  items: Opportunity[]
  isLoading: boolean
}

export function OpportunityGrid({ items, isLoading }: Props) {
  const player = usePlayerStore((s) => s.player)

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-card p-4 animate-pulse">
            <div className="h-1 bg-surface3 rounded mb-4" />
            <div className="flex justify-between mb-3">
              <div className="h-5 bg-surface3 rounded-full w-20" />
              <div className="h-5 bg-surface3 rounded-full w-20" />
            </div>
            <div className="h-4 bg-surface3 rounded w-3/4 mb-2" />
            <div className="h-3 bg-surface3 rounded w-1/2 mb-3" />
            <div className="h-3 bg-surface3 rounded w-full mb-2" />
            <div className="h-3 bg-surface3 rounded w-4/5" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <div className="text-4xl">🔍</div>
        <p className="text-sm font-medium text-text-2">Нет возможностей по выбранному фильтру</p>
        <p className="text-xs text-text-3">Попробуйте другой тип или сбросьте фильтр</p>
      </div>
    )
  }

  const sorted = [...items].sort((a, b) => {
    const ma = computeMatch(a, player?.country, player?.position)
    const mb = computeMatch(b, player?.country, player?.position)
    return mb - ma
  })

  return (
    <div className="grid grid-cols-3 gap-4">
      {sorted.map((opp) => (
        <OppCard
          key={opp.id}
          opp={opp}
          match={computeMatch(opp, player?.country, player?.position)}
        />
      ))}
    </div>
  )
}
