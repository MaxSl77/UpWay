import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

type Tab = 'signin' | 'register'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('signin')
  const { language, setLanguage } = useSettingsStore()

  const t = {
    tagline:  language === 'ru' ? 'AI-помощник для хоккейных семей'  : 'AI Assistant for Hockey Parents',
    signin:   language === 'ru' ? 'Войти'                            : 'Sign In',
    register: language === 'ru' ? 'Создать аккаунт'                  : 'Create Account',
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left branding panel ── */}
      <aside className="relative w-[360px] flex-shrink-0 bg-surface border-r border-border flex flex-col p-10 overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[radial-gradient(circle,rgba(34,214,122,.35)_0%,transparent_70%)] pointer-events-none" />

        <div className="font-display text-[26px] font-extrabold tracking-tight mb-2">
          Up<span className="text-accent">Way</span>
        </div>
        <p className="text-[13px] text-text-2 mb-auto">{t.tagline}</p>

        <div className="flex flex-col gap-7">
          {[
            { num: '12',     label: language === 'ru' ? 'Стран'   : 'Countries' },
            { num: '150+',   label: language === 'ru' ? 'Академий': 'Academies' },
            { num: '2 400+', label: language === 'ru' ? 'Семей'   : 'Active Families' },
          ].map(({ num, label }) => (
            <div key={label}>
              <div className="font-display text-[32px] font-extrabold leading-none">{num}</div>
              <div className="text-[12px] text-text-3 mt-1 font-medium uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Language toggle */}
        <div className="mt-10 flex gap-2">
          {(['ru', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={[
                'flex-1 h-8 rounded-btn border text-[12px] font-medium transition-all',
                language === l
                  ? 'bg-accent-dim border-accent text-accent'
                  : 'bg-surface2 border-border text-text-3 hover:text-text hover:border-text-3',
              ].join(' ')}
            >
              {l === 'ru' ? '🇷🇺 RU' : '🇺🇸 EN'}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Right auth card ── */}
      <main className="flex-1 flex items-center justify-center bg-bg p-10">
        <div className="w-full max-w-[480px] bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-accent to-[#10a060]" />
          <div className="p-8">
            {/* Tabs */}
            <div className="flex bg-surface2 rounded-xl p-0.5 mb-7">
              {(['signin', 'register'] as Tab[]).map((tabId) => (
                <button
                  key={tabId}
                  onClick={() => setTab(tabId)}
                  className={`flex-1 h-[38px] rounded-lg text-[13.5px] font-medium transition-all ${
                    tab === tabId
                      ? 'bg-surface text-text font-semibold shadow-sm'
                      : 'text-text-2'
                  }`}
                >
                  {tabId === 'signin' ? t.signin : t.register}
                </button>
              ))}
            </div>

            {tab === 'signin' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </main>
    </div>
  )
}
