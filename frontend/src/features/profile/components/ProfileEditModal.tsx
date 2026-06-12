import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/store/settingsStore'
import { validateHumanName, validatePlaceName } from '@/lib/validation'
import type { Player } from '@/types'
import type { PlayerUpdatePayload } from '../api'

const POSITIONS = [
  { value: 'forward',    label: 'Нападающий' },
  { value: 'defenseman', label: 'Защитник' },
  { value: 'goaltender', label: 'Вратарь' },
]

const LEVELS = [
  { value: 'amateur',      label: 'Любительский' },
  { value: 'dyussh',       label: 'ДЮСШ' },
  { value: 'sdyushor',     label: 'СДЮШОР' },
  { value: 'national',     label: 'Национальный' },
  { value: 'professional', label: 'Профессиональный' },
  { value: 'academy',      label: 'Академия' },
]

const SKILL_LABELS: Record<string, string> = {
  skating:  'Катание',
  shooting: 'Бросок',
  passing:  'Пас',
  fitness:  'Физическая форма',
  sense:    'Хоккейный интеллект',
}

interface Props {
  player: Player
  onSave: (payload: PlayerUpdatePayload) => Promise<void>
  onClose: () => void
}

export function ProfileEditModal({ player, onSave, onClose }: Props) {
  const [form, setForm] = useState<PlayerUpdatePayload>({
    name:        player.name,
    age:         player.age,
    heightCm:    player.heightCm,
    weightKg:    player.weightKg,
    position:    player.position,
    country:     player.country,
    city:        player.city ?? '',
    team:        player.team ?? '',
    hockeySchool: player.hockeySchool ?? '',
    level:       player.level,
    goals:       [...(player.goals ?? [])],
    skills:      { ...player.skills },
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const { language } = useSettingsStore()

  const set = (field: keyof PlayerUpdatePayload, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    const nameErr = validateHumanName(form.name ?? '', language)
    if (nameErr) errs.name = nameErr
    for (const key of ['country', 'city', 'team', 'hockeySchool'] as const) {
      const err = validatePlaceName((form[key] as string) ?? '', language)
      if (err) errs[key] = err
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const setSkill = (key: string, value: number) =>
    setForm((prev) => ({
      ...prev,
      skills: { ...(prev.skills as object), [key]: value },
    } as PlayerUpdatePayload))

  const handleGoalChange = (index: number, value: string) => {
    const updated = [...(form.goals ?? [])]
    updated[index] = value
    set('goals', updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    setError(null)
    try {
      // Strip empty optional strings → undefined so backend ignores them
      const payload: PlayerUpdatePayload = {
        ...form,
        city:        form.city        || undefined,
        team:        form.team        || undefined,
        hockeySchool: form.hockeySchool || undefined,
        goals:       (form.goals ?? []).filter(Boolean),
      }
      await onSave(payload)
      onClose()
    } catch {
      setError('Не удалось сохранить изменения. Попробуйте ещё раз.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-card w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-text">Редактировать профиль</h2>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Basic info */}
          <section>
            <h3 className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-3">
              Основное
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Имя" error={fieldErrors.name}>
                <input
                  type="text"
                  value={form.name}
                  maxLength={100}
                  onChange={(e) => set('name', e.target.value)}
                  required
                  className={cn(inputCls, fieldErrors.name && 'border-danger focus:border-danger')}
                />
              </Field>
              <Field label="Возраст">
                <input
                  type="number"
                  value={form.age}
                  min={5} max={25}
                  onChange={(e) => set('age', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Рост (см)">
                <input
                  type="number"
                  value={form.heightCm}
                  min={100} max={220}
                  onChange={(e) => set('heightCm', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Вес (кг)">
                <input
                  type="number"
                  value={form.weightKg}
                  min={30} max={130}
                  onChange={(e) => set('weightKg', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Амплуа">
                <select
                  value={form.position}
                  onChange={(e) => set('position', e.target.value)}
                  className={inputCls}
                >
                  {POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Уровень">
                <select
                  value={form.level}
                  onChange={(e) => set('level', e.target.value)}
                  className={inputCls}
                >
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* Geography */}
          <section>
            <h3 className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-3">
              География
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Страна" error={fieldErrors.country}>
                <input
                  type="text"
                  value={form.country}
                  maxLength={100}
                  onChange={(e) => set('country', e.target.value)}
                  className={cn(inputCls, fieldErrors.country && 'border-danger focus:border-danger')}
                />
              </Field>
              <Field label="Город" error={fieldErrors.city}>
                <input
                  type="text"
                  value={form.city ?? ''}
                  maxLength={100}
                  onChange={(e) => set('city', e.target.value)}
                  className={cn(inputCls, fieldErrors.city && 'border-danger focus:border-danger')}
                />
              </Field>
              <Field label="Команда" error={fieldErrors.team}>
                <input
                  type="text"
                  value={form.team ?? ''}
                  maxLength={100}
                  onChange={(e) => set('team', e.target.value)}
                  className={cn(inputCls, fieldErrors.team && 'border-danger focus:border-danger')}
                />
              </Field>
              <Field label="Хоккейная школа" error={fieldErrors.hockeySchool}>
                <input
                  type="text"
                  value={form.hockeySchool ?? ''}
                  maxLength={100}
                  onChange={(e) => set('hockeySchool', e.target.value)}
                  className={cn(inputCls, fieldErrors.hockeySchool && 'border-danger focus:border-danger')}
                />
              </Field>
            </div>
          </section>

          {/* Goals */}
          <section>
            <h3 className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-3">
              Цели
            </h3>
            <div className="flex flex-col gap-2">
              {(form.goals ?? []).map((g, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={g}
                    onChange={(e) => handleGoalChange(i, e.target.value)}
                    placeholder={i === 0 ? 'Основная цель (напр. МХЛ)' : 'Дополнительная цель'}
                    className={cn(inputCls, 'flex-1')}
                  />
                  {(form.goals ?? []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => set('goals', (form.goals ?? []).filter((_, j) => j !== i))}
                      className="text-text-3 hover:text-danger transition-colors text-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {(form.goals ?? []).length < 5 && (
                <button
                  type="button"
                  onClick={() => set('goals', [...(form.goals ?? []), ''])}
                  className="text-sm text-accent hover:underline text-left"
                >
                  + Добавить цель
                </button>
              )}
            </div>
          </section>

          {/* Skills */}
          <section>
            <h3 className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-3">
              Навыки (самооценка 1–10)
            </h3>
            <div className="flex flex-col gap-3">
              {Object.entries(SKILL_LABELS).map(([key, label]) => {
                const val = (form.skills as Record<string, number>)?.[key] ?? 5
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-44 text-sm text-text">{label}</span>
                    <input
                      type="range"
                      min={1} max={10} step={1}
                      value={val}
                      onChange={(e) => setSkill(key, Number(e.target.value))}
                      className="flex-1 accent-accent"
                    />
                    <span className="w-6 text-right text-sm font-bold text-accent">{val}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {error && (
            <p className="text-sm text-danger bg-danger-dim rounded-md px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-btn-sm px-4 rounded-btn text-sm font-medium border border-border bg-surface2 text-text hover:border-accent hover:text-accent transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-btn-sm px-5 rounded-btn text-sm font-semibold bg-accent text-[#0a1a11] hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-text-2">{label}</span>
      {children}
      {error && <span className="text-danger text-[11.5px]">{error}</span>}
    </label>
  )
}

const inputCls =
  'w-full h-9 px-3 rounded-btn text-sm bg-surface2 border border-border text-text ' +
  'focus:outline-none focus:border-accent transition-colors'
