import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { VerifyEmailBanner } from '@/components/shared/VerifyEmailBanner'

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden min-w-0">
        <VerifyEmailBanner />
        <Outlet />
      </main>
    </div>
  )
}
