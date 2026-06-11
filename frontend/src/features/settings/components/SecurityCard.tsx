import { useState } from 'react'
import { Lock, Eye, EyeOff, CheckCircle2, ChevronDown } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { authApi } from '@/features/auth/api'
import type { AxiosError } from 'axios'

export function SecurityCard() {
  const { language } = useSettingsStore()

  const [expanded, setExpanded] = useState(false)
  const [current, setCurrent]   = useState('')
  const [next, setNext]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const t = {
    title:      language === 'ru' ? 'Безопасность'        : 'Security',
    changePwd:  language === 'ru' ? 'Изменить пароль'     : 'Change password',
    current:    language === 'ru' ? 'Текущий пароль'      : 'Current password',
    newPwd:     language === 'ru' ? 'Новый пароль'        : 'New password',
    confirmPwd: language === 'ru' ? 'Подтвердить пароль'  : 'Confirm password',
    save:       language === 'ru' ? 'Сохранить'           : 'Save',
    saving:     language === 'ru' ? 'Сохранение...'       : 'Saving...',
    cancel:     language === 'ru' ? 'Отмена'              : 'Cancel',
    successMsg: language === 'ru' ? 'Пароль успешно изменён' : 'Password updated successfully',
    mismatch:   language === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match',
    tooShort:   language === 'ru' ? 'Минимум 8 символов'  : 'Minimum 8 characters',
    wrongCurrent: language === 'ru' ? 'Неверный текущий пароль' : 'Current password is incorrect',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (next.length < 8)   { setError(t.tooShort);  return }
    if (next !== confirm)  { setError(t.mismatch);   return }

    setLoading(true)
    try {
      await authApi.changePassword(current, next)
      setSuccess(true)
      setCurrent(''); setNext(''); setConfirm('')
      setExpanded(false)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      const status = (err as AxiosError)?.response?.status
      setError(status === 400 ? t.wrongCurrent : (language === 'ru' ? 'Ошибка. Попробуйте ещё раз.' : 'Error. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setExpanded(false)
    setError(null)
    setCurrent(''); setNext(''); setConfirm('')
  }

  const inputCls = 'w-full h-10 bg-surface2 border border-border rounded-btn px-3 text-[13px] text-text placeholder-text-3 focus:outline-none focus:border-accent transition-colors'

  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center">
          <Lock size={15} className="text-accent" />
        </div>
        <span className="font-semibold text-[14px]">{t.title}</span>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-accent-dim border border-accent rounded-btn px-3 py-2 text-accent text-[13px] mb-4">
          <CheckCircle2 size={14} />
          {t.successMsg}
        </div>
      )}

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-between h-10 px-3 bg-surface2 border border-border rounded-btn text-[13px] text-text-2 hover:border-accent hover:text-text transition-colors"
        >
          <span>{t.changePwd}</span>
          <ChevronDown size={14} />
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Current password */}
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder={t.current}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={inputCls + ' pr-10'}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2"
            >
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <input
            type={showPwd ? 'text' : 'password'}
            placeholder={t.newPwd}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputCls}
          />

          <input
            type={showPwd ? 'text' : 'password'}
            placeholder={t.confirmPwd}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={[
              inputCls,
              confirm && next !== confirm ? 'border-danger focus:border-danger' : '',
            ].join(' ')}
          />

          {error && <p className="text-danger text-[12px]">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 h-10 bg-surface2 border border-border rounded-btn text-[13px] text-text-2 hover:border-accent hover:text-text transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !current || !next || !confirm}
              className="flex-1 h-10 bg-accent text-[#0a1a11] rounded-btn font-semibold text-[13px] hover:bg-[#30e887] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
