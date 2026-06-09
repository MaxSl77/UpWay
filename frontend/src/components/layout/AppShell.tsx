import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

/**
 * AppShell wraps all authenticated app pages.
 * Sidebar is rendered once here; each page fills the remaining space.
 */
export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
