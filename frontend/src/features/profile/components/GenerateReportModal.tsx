import { FileText, X, Lock } from 'lucide-react'
import type { Player } from '@/types'

const SKILL_LABELS: Record<string, string> = {
  skating:  'Катание',
  shooting: 'Бросок',
  passing:  'Пас',
  fitness:  'Физическая форма',
  sense:    'Хоккейный интеллект',
}

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
  onClose: () => void
}

export function GenerateReportModal({ player, onClose }: Props) {
  const skills = player.skills ?? {}
  const skillValues = Object.values(skills) as number[]
  const avgSkill = skillValues.length
    ? (skillValues.reduce((a, b) => a + b, 0) / skillValues.length).toFixed(1)
    : '—'

  const today = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-card w-full max-w-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-accent" />
            <h2 className="font-display text-[15px] font-bold text-text">
              Отчёт о развитии игрока
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-3 hover:text-text hover:bg-surface2 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Report preview */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Player header */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#1a5c3a,#22d67a)' }}
            >
              {player.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="font-display text-base font-extrabold text-text">{player.name}</p>
              <p className="text-xs text-text-2">
                {POSITION_LABEL[player.position] ?? player.position} · {player.age} лет ·{' '}
                {LEVEL_LABEL[player.level] ?? player.level}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-text-3 uppercase tracking-widest">Дата</p>
              <p className="text-xs font-medium text-text-2">{today}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Рост', value: `${player.heightCm} см` },
              { label: 'Вес',  value: `${player.weightKg} кг` },
              { label: 'Ср. навык', value: `${avgSkill}/10` },
              { label: 'Целей', value: String(player.goals?.length ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface2 border border-border rounded-card p-3 text-center">
                <p className="font-display text-base font-extrabold text-accent">{value}</p>
                <p className="text-[10px] text-text-3 uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-2.5">
              Навыки
            </p>
            <div className="flex flex-col gap-2">
              {Object.entries(skills).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span className="w-40 text-xs text-text-2 flex-shrink-0">
                    {SKILL_LABELS[key] ?? key}
                  </span>
                  <div className="flex-1 h-1.5 bg-surface3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${((val as number) / 10) * 100}%`,
                        background: 'linear-gradient(90deg,#0f8a4a,#22d67a)',
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-bold text-accent">{val as number}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          {player.goals?.length > 0 && (
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-2">
                Цели
              </p>
              <div className="flex flex-wrap gap-1.5">
                {player.goals.map((g, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      i === 0 ? 'bg-accent-dim text-accent' : 'bg-surface3 text-text-2'
                    }`}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <p className="text-[11px] text-text-3">
            На основе самооценки навыков · UpWay v0.1
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-btn bg-surface2 border border-border text-sm text-text-2 hover:text-text hover:border-text-3 transition-all"
            >
              Закрыть
            </button>
            <button
              disabled
              className="h-9 px-4 rounded-btn bg-surface2 border border-border text-sm text-text-3 flex items-center gap-1.5 cursor-not-allowed"
              title="Скоро"
            >
              <Lock size={12} />
              Скачать PDF
              <span className="text-[10px] bg-orange-dim text-orange px-1.5 py-0.5 rounded-full font-medium">
                Скоро
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
