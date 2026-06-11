import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import { authApi } from '../api'

type State = 'input' | 'success' | 'error'

export function ResetPassword() {
  const { language } = useSettingsStore()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [state,    setState]    = useState<State>(token ? 'input' : 'error')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [errMsg,   setErrMsg]   = useState('')

  const t = {
    title:        language === 'ru' ? 'Новый пароль'          : 'Set new password',
    subtitle:     language === 'ru' ? 'Введите новый пароль для вашего аккаунта.' : 'Enter your new account password.',
    passLabel:    language === 'ru' ? 'Новый пароль'          : 'New password',
    confirmLabel: language === 'ru' ? 'Повторите пароль'      : 'Confirm password',
    saveBtn:      language === 'ru' ? 'Сохранить пароль'      : 'Save password',
    saving:       language === 'ru' ? 'Сохранение...'         : 'Saving...',
    successTitle: language === 'ru' ? 'Пароль изменён!'       : 'Password updated!',
    successSub:   language === 'ru' ? 'Теперь войдите с новым паролем.' : 'You can now sign in with your new password.',
    goLogin:      language === 'ru' ? 'Войти в аккаунт'       : 'Sign in',
    errorTitle:   language === 'ru' ? 'Ссылка недействительна': 'Link is invalid',
    errorSub:     language === 'ru' ? 'Ссылка устарела или уже использована. Запросите новую.' : 'The link has expired or already been used. Request a new one.',
    newRequest:   language === 'ru' ? 'Запросить новую ссылку': 'Request new link',
    mismatch:     language === 'ru' ? 'Пароли не совпадают'   : 'Passwords do not match',
    tooShort:     language === 'ru' ? 'Минимум 8 символов'    : 'Minimum 8 characters',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrMsg('')

    if (password.length < 8)       { setErrMsg(t.tooShort); return }
    if (password !== confirm)       { setErrMsg(t.mismatch); return }

    setLoading(true)
    try {
      await authApi.confirmPasswordReset(token, password)
      setState('success')
      setTimeout(() => navigate('/login'), 3000)
    } catch {
      setState('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-accent to-[#10a060]" />
      <div className="p-8">

        {state === 'input' && (
          <form onSubmit={handleSubmit}>
            <h2 className="font-display text-[22px] font-bold mb-1">{t.title}</h2>
            <p className="text-[13px] text-text-2 mb-6">{t.subtitle}</p>

            <div className="mb-4">
              <label className="block text-[12.5px] font-medium text-text-2 mb-1.5">{t.passLabel}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                className="w-full h-[44px] px-3.5 bg-surface2 border border-border rounded-btn text-text text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="mb-5">
              <label className="block text-[12.5px] font-medium text-text-2 mb-1.5">{t.confirmLabel}</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-[44px] px-3.5 bg-surface2 border border-border rounded-btn text-text text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {errMsg && (
              <p className="text-red-400 text-[12.5px] mb-4">{errMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] bg-accent text-[#0a1a11] rounded-btn font-bold text-[15px] hover:bg-[#30e887] transition-all disabled:opacity-60"
            >
              {loading ? t.saving : t.saveBtn}
            </button>
          </form>
        )}

        {state === 'success' && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-accent-dim border border-accent/30 flex items-center justify-center text-2xl mx-auto mb-5">✅</div>
            <h2 className="font-display text-[22px] font-bold mb-2">{t.successTitle}</h2>
            <p className="text-[13px] text-text-2 mb-6">{t.successSub}</p>
            <Link
              to="/login"
              className="block w-full h-[44px] bg-accent text-[#0a1a11] rounded-btn font-bold text-[15px] flex items-center justify-center hover:bg-[#30e887] transition-all"
            >
              {t.goLogin}
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-red-900/30 border border-red-500/30 flex items-center justify-center text-2xl mx-auto mb-5">⛔</div>
            <h2 className="font-display text-[22px] font-bold mb-2">{t.errorTitle}</h2>
            <p className="text-[13px] text-text-2 mb-6">{t.errorSub}</p>
            <Link
              to="/recovery"
              className="block w-full h-[44px] bg-accent text-[#0a1a11] rounded-btn font-bold text-[15px] flex items-center justify-center hover:bg-[#30e887] transition-all"
            >
              {t.newRequest}
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
