import type { Player } from '@/types'

type FormData = Partial<Omit<Player, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
interface Props { data: FormData; onChange: (d: FormData) => void }

const skillDefs = [
  { key: 'skating',  label: 'Катание',              icon: '⛸️', desc: 'Скорость, манёвренность, торможение' },
  { key: 'shooting', label: 'Бросок',               icon: '🏒', desc: 'Сила, точность, быстрый кистевой' },
  { key: 'passing',  label: 'Передачи',             icon: '🎯', desc: 'Точность паса, видение площадки' },
  { key: 'fitness',  label: 'Физическая форма',     icon: '💪', desc: 'Выносливость, сила, скорость реакции' },
  { key: 'sense',    label: 'Хоккейный интеллект',  icon: '🧠', desc: 'Чтение игры, позиционирование' },
] as const

type SkillKey = typeof skillDefs[number]['key']

const levelLabel = (v: number) => {
  if (v <= 2) return 'Начинающий'
  if (v <= 4) return 'Ниже среднего'
  if (v <= 6) return 'Средний'
  if (v <= 8) return 'Выше среднего'
  return 'Элита'
}

export function StepSkills({ data, onChange }: Props) {
  const skills = data.skills ?? { skating: 5, shooting: 5, passing: 5, fitness: 5, sense: 5 }

  const setSkill = (key: SkillKey, val: number) =>
    onChange({ skills: { ...skills, [key]: val } })

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-text-2">Оцените текущий уровень игрока честно — это поможет AI составить реалистичный план.</p>
      {skillDefs.map(({ key, label, icon, desc }) => {
        const val = skills[key] ?? 5
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <div>
                  <p className="text-[13.5px] font-semibold text-text">{label}</p>
                  <p className="text-[11px] text-text-3">{desc}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[22px] font-black text-accent">{val}</span>
                <p className="text-[10.5px] text-text-3">{levelLabel(val)}</p>
              </div>
            </div>
            <div className="relative h-2 bg-surface3 rounded-full">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${(val / 10) * 100}%` }}
              />
              <input
                type="range" min={1} max={10} step={1} value={val}
                onChange={(e) => setSkill(key, Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-3 mt-1">
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
