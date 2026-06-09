import { type ReactNode, useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { useSettingsStore } from '@/store/settingsStore'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const html = document.documentElement
    if (theme === 'light') {
      html.classList.add('light')
      html.classList.remove('dark')
    } else {
      html.classList.remove('light')
      html.classList.add('dark')
    }
  }, [theme])

  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
