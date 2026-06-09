import { FileText, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Player } from '@/types'
import { useAuthStore } from '@/store/authStore'

const POSITION_LABEL: Record<string, string> = {
  forward:    'Нападающий',
  defenseman: 'Защитник',
  goaltender: 'Вратарь',
}

const LEVEL_LABEL: Record<string, string> = {
  amateur:      'Любительский',
  dyussh:       'ДЮСШ',
  sdyushor:     'СДЮШОР',
  national:     'Национальный',
  professional: 'Профессиональный',
  academy:      'Академия',
}

interface Props {
  player: Player
  onEdit: () => void
  onReport: () => void
}

export function PlayerProfileHeader({ player, onEdit, onReport }: Props) {
  const plan = useAuthStore((s) => s.user?.plan ?? 'free')
  const canReport = plan === 'starter' || plan === 'pro'
  // Generate initials from player name
  const initials = player.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const primaryGoal = player.goals?.[0] ?? null
  const positionLabel = POSITION_LABEL[player.position] ?? player.position
  const levelLabel = LEVEL_LABEL[player.level] ?? player.level

  return (
    <div className="px-7 py-6 border-b border-border bg-surface flex items-start gap-5">
      {/* Avatar */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #1a5c3a, #22d67a)' }}
      >
        {initials}
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-2xl font-extrabold text-text leading-tight">
          {player.name}
        </h1>

        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-2">
          <span>⚡ {positionLabel}</span>
          <span>📅 {player.age} лет</span>
          {player.city && <span>📍 {player.city}, {player.country}</span>}
          {!player.city && <span>📍 {player.country}</span>}
          {player.team && <span>🏒 {player.team}</span>}
          {player.hockeySchool && <span>🏫 {player.hockeySchool}</span>}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium bg-accent-dim text-accent">
            ● Активен
          </span>
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium bg-surface3 text-text-2">
            {levelLabel}
          </span>
          {primaryGoal && (
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium bg-orange-dim text-orange">
              Цель: {primaryGoal}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 flex-shrink-0">
        <button
          onClick={onEdit}
          className={cn(
            'h-btn-sm px-4 rounded-btn text-sm font-medium border border-border',
            'bg-surface2 text-text hover:border-accent hover:text-accent transition-colors',
          )}
        >
          Редактировать
        </button>

        {canReport ? (
          <button
            onClick={onReport}
            className={cn(
              'h-btn-sm px-4 rounded-btn text-sm font-semibold flex items-center gap-1.5',
              'bg-accent text-[#0a1a11] hover:brightness-110 transition-all',
            )}
          >
            <FileText size={13} />
            Отчёт
          </button>
        ) : (
          <button
            disabled
            title="Доступно на тарифах Starter и Pro"
            className="h-btn-sm px-4 rounded-btn text-sm font-medium border border-border bg-surface2 text-text-3 flex items-center gap-1.5 cursor-not-allowed"
          >
            <Lock size={12} />
            Отчёт
          </button>
        )}
      </div>
    </div>
  )
}
