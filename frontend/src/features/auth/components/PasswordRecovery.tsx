import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import { authApi } from '../api'

type State = 'input' | 'sent'

export function PasswordRecovery() {
  const { language } = useSettingsStore()
  const [state,     setState]     = useState<State>('input')
  const [email,     setEmail]     = useState('')
  const [sentEmail, setSentEmail] = useState('')
  const [countdown, setCountdown] = useState(59)
  const [canResend, setCanResend] = useState(false)

  const t = {
    backToSignIn:   language === 'ru' ? '← Назад к входу'                      : '← Back to Sign In',
    title:          language === 'ru' ? 'Забыли пароль?'                         : 'Forgot password?',
    subtitle:       language === 'ru' ? 'Введите email — отправим ссылку для сброса.' : 'Enter your email and we\'ll send you a reset link.',
    emailLabel:     language === 'ru' ? 'Email адрес'                            : 'Email address',
    sendBtn:        language === 'ru' ? 'Отправить ссылку'                       : 'Send Reset Link',
    checkTitle:     language === 'ru' ? 'Проверьте почту'                        : 'Check your email',
    checkSubtitle:  language === 'ru' ? 'Мы отправили ссылку на'                 : 'We sent a reset link to',
    resendIn:       (s: number) =>
      language === 'ru' ? `Повторная отправка через ${s}с` : `Resend available in ${s}s`,
    resend:         language === 'ru' ? 'Отправить снова →'  : 'Resend email →',
    backBtn:        language === 'ru' ? 'Вернуться ко входу' : 'Back to Sign In',
  }

  useEffect(() => {
    if (state !== 'sent') return
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); setCanResend(true); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [state])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    await authApi.requestPasswordReset(email)
    setSentEmail(email)
    setState('sent')
  }

  const handleResend = async () => {
    await authApi.requestPasswordReset(sentEmail)
    setCountdown(59)
    setCanResend(false)
  }

  return (
    <div className="w-full max-w-[440px] bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-accent to-[#10a060]" />
      <div className="p-8">
        <Link to="/login" className="flex items-center gap-1.5 text-accent text-[12.5px] mb-5">
          {t.backToSignIn}
        </Link>

        {state === 'input' ? (
          <form onSubmit={handleSend}>
            <h2 className="font-display text-[22px] font-bold mb-1">{t.title}</h2>
            <p className="text-[13px] text-text-2 mb-6">{t.subtitle}</p>
            <div className="mb-4">
              <label className="block text-[12.5px] font-medium text-text-2 mb-1.5">{t.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-[44px] px-3.5 bg-surface2 border border-border rounded-btn text-text text-sm focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full h-[44px] bg-accent text-[#0a1a11] rounded-btn font-bold text-[15px] hover:bg-[#30e887] transition-all"
            >
              {t.sendBtn}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-accent-dim border border-accent/30 flex items-center justify-center text-2xl mx-auto mb-5">📧</div>
            <h2 className="font-display text-[22px] font-bold mb-1">{t.checkTitle}</h2>
            <p className="text-[13px] text-text-2 mb-2">
              {t.checkSubtitle}<br />
              <strong className="text-text">{sentEmail}</strong>
            </p>
            <div className="my-5 text-[13px] text-text-2">
              {canResend ? (
                <button onClick={handleResend} className="text-accent hover:underline">{t.resend}</button>
              ) : (
                <span>{t.resendIn(countdown)}</span>
              )}
            </div>
            <Link
              to="/login"
              className="block w-full h-[44px] bg-accent text-[#0a1a11] rounded-btn font-bold text-[15px] flex items-center justify-center hover:bg-[#30e887] transition-all"
            >
              {t.backBtn}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
