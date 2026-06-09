import { PasswordRecovery } from '@/features/auth/components/PasswordRecovery'

export default function RecoveryPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[360px] flex-shrink-0 bg-surface border-r border-border flex flex-col p-10">
        <div className="font-display text-[26px] font-extrabold tracking-tight mb-2">
          Up<span className="text-accent">Way</span>
        </div>
        <p className="text-[13px] text-text-2">AI Assistant for Hockey Parents</p>
      </aside>
      <main className="flex-1 flex items-center justify-center bg-bg p-10">
        <PasswordRecovery />
      </main>
    </div>
  )
}
