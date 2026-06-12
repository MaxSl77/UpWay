import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, MessageSquare, Map, Calendar,
  Trophy, User, CreditCard, Settings, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const NAV_ITEMS = [
    {
      group: t('nav.groupMain'),
      items: [
        { to: '/dashboard',     label: t('nav.dashboard'),     icon: LayoutDashboard },
        { to: '/chat',          label: t('nav.chat'),          icon: MessageSquare },
        { to: '/roadmap',       label: t('nav.roadmap'),       icon: Map },
        { to: '/calendar',      label: t('nav.calendar'),      icon: Calendar },
        { to: '/opportunities', label: t('nav.opportunities'), icon: Trophy },
      ],
    },
    {
      group: t('nav.groupAccount'),
      items: [
        { to: '/profile',      label: t('nav.profile'),      icon: User },
        { to: '/subscription', label: t('nav.subscription'), icon: CreditCard },
        { to: '/settings',     label: t('nav.settings'),     icon: Settings },
      ],
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col w-[220px] h-screen flex-shrink-0 bg-surface border-r border-border">
      {/* Logo */}
      <div className="flex items-center h-[60px] px-4 border-b border-border flex-shrink-0">
        <span className="font-display text-xl font-extrabold tracking-tight">
          Up<span className="text-accent">Way</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-5 scrollbar-thin">
        {NAV_ITEMS.map(({ group, items }) => (
          <div key={group}>
            <p className="text-[10px] font-semibold tracking-widest text-text-3 uppercase px-2 mb-1">
              {group}
            </p>
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 h-[38px] px-2.5 rounded-lg text-[13.5px] transition-colors',
                    isActive
                      ? 'bg-accent-dim text-accent font-medium'
                      : 'text-text-2 hover:bg-surface2 hover:text-text',
                  )
                }
              >
                <Icon size={16} className="flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User block */}
      <div className="p-3 border-t border-border flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#1a5c3a] to-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {user?.fullName?.charAt(0) ?? 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate">{user?.fullName ?? 'User'}</p>
          <p className="text-[11px] text-accent font-medium">
            {t(`plan.${user?.plan ?? 'free'}`)}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-text-3 hover:text-danger transition-colors"
          title={t('nav.signOut')}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
