import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { useState } from 'react'

type Tab = 'signin' | 'register'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('signin')

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left branding panel ── */}
      <aside className="relative w-[360px] flex-shrink-0 bg-surface border-r border-border flex flex-col p-10 overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[radial-gradient(circle,rgba(34,214,122,.35)_0%,transparent_70%)] pointer-events-none" />

        <div className="font-display text-[26px] font-extrabold tracking-tight mb-2">
          Up<span className="text-accent">Way</span>
        </div>
        <p className="text-[13px] text-text-2 mb-auto">AI Assistant for Hockey Parents</p>

        <div className="flex flex-col gap-7">
          {[
            { num: '12',    label: 'Countries' },
            { num: '150+',  label: 'Academies' },
            { num: '2,400+',label: 'Active Families' },
          ].map(({ num, label }) => (
            <div key={label}>
              <div className="font-display text-[32px] font-extrabold leading-none">{num}</div>
              <div className="text-[12px] text-text-3 mt-1 font-medium uppercase tracking-wide">{label}</div>
            </div>
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
              {(['signin', 'register'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 h-[38px] rounded-lg text-[13.5px] font-medium transition-all ${
                    tab === t
                      ? 'bg-surface text-text font-semibold shadow-sm'
                      : 'text-text-2'
                  }`}
                >
                  {t === 'signin' ? 'Sign In' : 'Create Account'}
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
