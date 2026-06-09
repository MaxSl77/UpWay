import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { AuthGuard } from '@/components/shared/AuthGuard'

// Auth screens (no shell)
const LoginPage       = lazy(() => import('@/pages/LoginPage'))
const RecoveryPage    = lazy(() => import('@/pages/RecoveryPage'))
const OnboardingPage  = lazy(() => import('@/pages/OnboardingPage'))

// App screens (inside AppShell)
const DashboardPage     = lazy(() => import('@/pages/DashboardPage'))
const ChatPage          = lazy(() => import('@/pages/ChatPage'))
const RoadmapPage       = lazy(() => import('@/pages/RoadmapPage'))
const CalendarPage      = lazy(() => import('@/pages/CalendarPage'))
const OpportunitiesPage = lazy(() => import('@/pages/OpportunitiesPage'))
const ProfilePage       = lazy(() => import('@/pages/ProfilePage'))
const SubscriptionPage  = lazy(() => import('@/pages/SubscriptionPage'))
const PaymentPage       = lazy(() => import('@/pages/PaymentPage'))
const SettingsPage      = lazy(() => import('@/pages/SettingsPage'))

const wrap = (el: React.ReactNode) => (
  <Suspense fallback={<FullPageSpinner />}>{el}</Suspense>
)

export const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────
  {
    path: '/login',
    element: wrap(<LoginPage />),
  },
  {
    path: '/recovery',
    element: wrap(<RecoveryPage />),
  },

  // ── Onboarding (authenticated but no shell) ────
  {
    path: '/onboarding',
    element: (
      <AuthGuard>
        {wrap(<OnboardingPage />)}
      </AuthGuard>
    ),
  },

  // ── App shell (authenticated) ──────────────────
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',     element: wrap(<DashboardPage />) },
      { path: 'chat',          element: wrap(<ChatPage />) },
      { path: 'chat/:id',      element: wrap(<ChatPage />) },
      { path: 'roadmap',       element: wrap(<RoadmapPage />) },
      { path: 'calendar',      element: wrap(<CalendarPage />) },
      { path: 'opportunities', element: wrap(<OpportunitiesPage />) },
      { path: 'profile',       element: wrap(<ProfilePage />) },
      { path: 'subscription',  element: wrap(<SubscriptionPage />) },
      { path: 'payment',       element: wrap(<PaymentPage />) },
      { path: 'settings',      element: wrap(<SettingsPage />) },
    ],
  },

  // ── Fallback ───────────────────────────────────
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
