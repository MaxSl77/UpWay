import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { authApi } from '@/features/auth/api'
import type { AxiosError } from 'axios'

export default function VerifyPendingPage() {
  const user        = useAuthStore((s) => s.user)
  const forceLogout = useAuthStore((s) => s.forceLogout)
  const navigate    = useNavigate()
  const { language } = useSettingsStore()
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)

  const resend = async () => {
    setLoading(true)
    try {
      await authApi.resendVerification()
      setSent(true)
    } catch (err) {
      const status = (err as AxiosError)?.response?.status
      if (status === 401) {
        forceLogout()
        navigate('/login', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  const t = {
    title:   language === 'ru' ? 'Проверьте почту'     : 'Check your inbox',
    sub1:    language === 'ru' ? 'Мы отправили письмо с ссылкой подтверждения на' : 'We sent a verification link to',
    sub2:    language === 'ru'
      ? 'Перейдите по ссылке в письме, чтобы активировать аккаунт и продолжить.'
      : 'Follow the link in the email to activate your account and continue.',
    spam:    language === 'ru' ? 'Не забудьте проверить папку «Спам».' : "Don't forget to check your Spam folder.",
    resend:  language === 'ru' ? 'Выслать повторно'    : 'Resend email',
    sending: language === 'ru' ? 'Отправляем…'         : 'Sending…',
    sent:    language === 'ru' ? '✓ Письмо отправлено' : '✓ Email sent',
  }

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
            <div className="w-14 h-14 rounded-xl bg-accent-dim border border-accent/30 flex items-center justify-center text-2xl mx-auto mb-5">
              📬
            </div>
            <h2 className="font-display text-[22px] font-bold mb-2">{t.title}</h2>
            {user && (
              <p className="text-[13px] text-text-2 mb-1">
                {t.sub1} <strong className="text-text">{user.email}</strong>
              </p>
            )}
            <p className="text-[13px] text-text-2 mb-6">{t.sub2}</p>
            <p className="text-[12px] text-text-3 mb-6">{t.spam}</p>

            {sent ? (
              <p className="text-accent text-[13px] font-medium">{t.sent}</p>
            ) : (
              <button
                onClick={resend}
                disabled={loading}
                className="w-full h-[44px] border border-accent text-accent rounded-btn font-bold text-[14px] hover:bg-accent-dim transition-all disabled:opacity-50"
              >
                {loading ? t.sending : t.resend}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
