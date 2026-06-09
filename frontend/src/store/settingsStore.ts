import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'ru' | 'en'
export type Theme = 'dark' | 'light'
export type Currency = 'byn' | 'rub' | 'usd'

export interface NotificationSettings {
  emailRoadmap: boolean
  emailOpportunities: boolean
  emailWeeklyReport: boolean
  pushAlerts: boolean
}

interface SettingsState {
  language: Language
  theme: Theme
  currency: Currency
  notifications: NotificationSettings

  setLanguage: (lang: Language) => void
  setTheme: (theme: Theme) => void
  setCurrency: (currency: Currency) => void
  toggleNotification: (key: keyof NotificationSettings) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ru',
      theme: 'dark',
      currency: 'rub',
      notifications: {
        emailRoadmap: true,
        emailOpportunities: true,
        emailWeeklyReport: false,
        pushAlerts: false,
      },

      setLanguage: (language) => {
        // Auto-set default currency for language
        set((state) => ({
          language,
          currency:
            language === 'en'
              ? 'usd'
              : state.currency === 'usd'
              ? 'rub'
              : state.currency,
        }))
      },

      setTheme: (theme) => {
        set({ theme })
        // Apply to DOM immediately
        const html = document.documentElement
        if (theme === 'light') {
          html.classList.add('light')
          html.classList.remove('dark')
        } else {
          html.classList.remove('light')
          html.classList.add('dark')
        }
      },

      setCurrency: (currency) => set({ currency }),

      toggleNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: !state.notifications[key],
          },
        })),
    }),
    {
      name: 'upway-settings',
    },
  ),
)
