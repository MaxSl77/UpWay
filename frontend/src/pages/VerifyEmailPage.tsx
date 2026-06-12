import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { authApi } from '@/features/auth/api'
import api from '@/lib/api'

type State = 'verifying' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const setUser         = useAuthStore((s) => s.setUser)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { language }    = useSettingsStore()
  const token           = searchParams.get('token') ?? ''

  const [state, setState] = useState<State>(token ? 'verifying' : 'error')

  const t = {
    verifying:    language === 'ru' ? 'Подтверждаем email…'        : 'Verifying email…',
    successTitle: language === 'ru' ? 'Email подтверждён!'          : 'Email verified!',
    successSub:   language === 'ru' ? 'Ваш аккаунт активирован. Сейчас перенаправляем вас…' : 'Your account is now active. Redirecting…',
    errorTitle:   language === 'ru' ? 'Ссылка недействительна'      : 'Link is invalid',
    errorSub:     language === 'ru' ? 'Ссылка устарела или уже использована.' : 'The link has expired or already been used.',
    goLogin:      language === 'ru' ? 'Войти в аккаунт'             : 'Sign in',
  }

  useEffect(() => {
    if (!token) return
    authApi.verifyEmail(token)
      .then(async () => {
        try {
          const me = await authApi.me()
          setUser(me)
        } catch {
          // не критично: пользователь обновится при следующем запросе
        }
        setState('success')
        // Check if player profile already exists to decide where to send the user
        let destination = '/login'
        if (isAuthenticated) {
          try {
            await api.get('/players/me')
            destination = '/dashboard'   // profile exists — onboarding already done
          } catch {
            destination = '/onboarding'  // no profile — first time, go through onboarding
          }
        }
        setTimeout(() => navigate(destination), 2500)
      })
      .catch(() => setState('error'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[360px] flex-shrink-0 bg-surface border-r border-border flex flex-col p-10">
        <div className="font-display text-[26px] font-extrabold tracking-tight mb-2">
          Up<span className="text-accent">Way</span>
        </div>
        <p className="text-[13px] text-text-2">
          {language === 'ru' ? 'AI-помощник для хоккейных семей' : 'AI Assistant for Hockey Parents'}
        </p>
      </aside>

      <main className="flex-1 flex items-center justify-center bg-bg p-10">
        <div className="w-full max-w-[440px] bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-accent to-[#10a060]" />
          <div className="p-8 text-center">

            {state === 'verifying' && (
              <>
                <div className="w-14 h-14 rounded-xl bg-surface2 border border-border flex items-center justify-center mx-auto mb-5">
                  <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="font-display text-[22px] font-bold mb-2">{t.verifying}</h2>
              </>
            )}

            {state === 'success' && (
              <>
                <div className="w-14 h-14 rounded-xl bg-accent-dim border border-accent/30 flex items-center justify-center text-2xl mx-auto mb-5">✅</div>
                <h2 className="font-display text-[22px] font-bold mb-2">{t.successTitle}</h2>
                <p className="text-[13px] text-text-2">{t.successSub}</p>
              </>
            )}

            {state === 'error' && (
              <>
                <div className="w-14 h-14 rounded-xl bg-red-900/30 border border-red-500/30 flex items-center justify-center text-2xl mx-auto mb-5">⛔</div>
                <h2 className="font-display text-[22px] font-bold mb-2">{t.errorTitle}</h2>
                <p className="text-[13px] text-text-2 mb-6">{t.errorSub}</p>
                <Link
                  to="/login"
                  className="block w-full h-[44px] bg-accent text-[#0a1a11] rounded-btn font-bold text-[15px] flex items-center justify-center hover:bg-[#30e887] transition-all"
                >
                  {t.goLogin}
                </Link>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
