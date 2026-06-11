import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated  = useAuthStore((s) => s.isAuthenticated)
  const user             = useAuthStore((s) => s.user)
  const location         = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated but email not verified — must verify before using the app
  if (user && !user.isEmailVerified) {
    return <Navigate to="/verify-pending" replace />
  }

  return <>{children}</>
}
