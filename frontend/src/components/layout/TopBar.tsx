import { type ReactNode } from 'react'
import { Zap } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'

interface TopBarProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function TopBar({ title, subtitle, action }: TopBarProps) {
  const { player } = usePlayerStore()

  return (
    <header className="flex items-center h-[60px] flex-shrink-0 bg-surface border-b border-border px-7 gap-3">
      <div>
        <h1 className="font-display text-lg font-bold">{title}</h1>
        {subtitle && <p className="text-xs text-text-2">{subtitle}</p>}
      </div>

      <div className="flex-1" />

      {action && <div className="flex-shrink-0">{action}</div>}

      {player && (
        <div className="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-1 text-[12.5px] text-text-2">
          <Zap size={14} />
          <strong className="text-text">{player.name}</strong>
          &nbsp;·&nbsp;{player.age}&nbsp;·&nbsp;
          <span className="capitalize">{player.position}</span>
        </div>
      )}
    </header>
  )
}
