import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { authApi } from '@/features/auth/api'

export function VerifyEmailBanner() {
  const user     = useAuthStore((s) => s.user)
  const { language } = useSettingsStore()
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)

  if (!user || user.isEmailVerified) return null

  const resend = async () => {
    setLoading(true)
    try {
      await authApi.resendVerification()
      setSent(true)
    } catch {
      // тихий сбой: баннер остаётся, можно повторить
    } finally {
      setLoading(false)
    }
  }

  const t = {
    msg:    language === 'ru'
      ? `Подтвердите email: мы отправили письмо на ${user.email}`
      : `Please verify your email — we sent a link to ${user.email}`,
    btn:    language === 'ru' ? 'Выслать повторно' : 'Resend',
    sent:   language === 'ru' ? 'Письмо отправлено!' : 'Email sent!',
    sending: language === 'ru' ? 'Отправляем…' : 'Sending…',
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-900/30 border-b border-amber-500/30 text-[13px]">
      <span className="text-amber-400 shrink-0">⚠</span>
      <span className="text-amber-200 flex-1">{t.msg}</span>
      {sent ? (
        <span className="text-accent text-[12px] shrink-0">{t.sent}</span>
      ) : (
        <button
          onClick={resend}
          disabled={loading}
          className="text-accent text-[12px] font-medium hover:underline shrink-0 disabled:opacity-50"
        >
          {loading ? t.sending : t.btn}
        </button>
      )}
    </div>
  )
}
