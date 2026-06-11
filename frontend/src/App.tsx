import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { Providers } from './app/providers'
import { useAuthStore } from './store/authStore'

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const initialize  = useAuthStore((s) => s.initialize)
  const bootstrapped = useAuthStore((s) => s.bootstrapped)

  useEffect(() => { initialize() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!bootstrapped) return null

  return <>{children}</>
}

export default function App() {
  return (
    <Providers>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
    </Providers>
  )
}
