import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import api from '@/lib/api'
import type { PlanId } from '@/types'

export type PaymentResult = 'success' | 'failure' | null

interface PlanDefinition {
  id: PlanId
  nameRu: string
  nameEn: string
  prices: { rub: number; byn: number; usd: number }
  featuresRu: string[]
  featuresEn: string[]
  badge?: string
}

export const PLAN_DEFS: PlanDefinition[] = [
  {
    id: 'free',
    nameRu: 'Бесплатный',
    nameEn: 'Free',
    prices: { rub: 0, byn: 0, usd: 0 },
    featuresRu: [
      'AI-чат (10 сообщений/день)',
      'До 5 событий в календаре',
      'Дашборд с метриками',
      'Без роадмапа и базы знаний',
    ],
    featuresEn: [
      'AI chat (10 messages/day)',
      'Up to 5 calendar events',
      'Metrics dashboard',
      'No roadmap or knowledge base',
    ],
  },
  {
    id: 'starter',
    nameRu: 'Старт',
    nameEn: 'Starter',
    prices: { rub: 890, byn: 29, usd: 9 },
    badge: '🏒 Рекомендуем',
    featuresRu: [
      'AI-чат (30 сообщений/день)',
      'База знаний МХЛ/ВХЛ/ФХР',
      'Полный роадмап карьеры (9 этапов)',
      'До 5 событий в календаре в день',
      'Анализ роадмапа в чате',
    ],
    featuresEn: [
      'AI chat (30 messages/day)',
      'MHL/VHL/FHR knowledge base',
      'Full career roadmap (9 milestones)',
      'Up to 5 calendar events per day',
      'Roadmap analysis in chat',
    ],
  },
]

export function useSubscription() {
  const { currency } = useSettingsStore()

  const [paymentModal, setPaymentModal] = useState<PlanId | null>(null)
  const [paymentResult, setPaymentResult] = useState<PaymentResult>(null)
  const [mockOutcome, setMockOutcome] = useState<'success' | 'failure'>('success')
  const [processing, setProcessing] = useState(false)

  const currentPlan = (useAuthStore((s) => s.user)?.plan ?? 'free') as PlanId

  const openPayment = (planId: PlanId) => {
    setPaymentResult(null)
    setPaymentModal(planId)
  }

  const closePayment = () => {
    setPaymentModal(null)
    setPaymentResult(null)
  }

  // Reset to form (used by "Try again" button)
  const retryPayment = () => {
    setPaymentResult(null)
  }

  const processPayment = async () => {
    if (!paymentModal) return
    setProcessing(true)

    await new Promise((r) => setTimeout(r, 1800))

    if (mockOutcome === 'success') {
      // 1. Update local state immediately (optimistic)
      const freshUser = useAuthStore.getState().user
      if (freshUser) {
        useAuthStore.getState().setUser({ ...freshUser, plan: paymentModal })
      }

      // 2. Persist to DB via API (fire-and-forget, don't block UI)
      api.patch('/auth/me/plan', { plan: paymentModal }).catch(() => {
        // Backend unavailable in dev — local state still updated
      })

      setPaymentResult('success')
    } else {
      setPaymentResult('failure')
    }

    setProcessing(false)
  }

  const formatPrice = (prices: { rub: number; byn: number; usd: number }): string => {
    const symbols: Record<string, string> = { rub: '₽', byn: 'Br', usd: '$' }
    const val = prices[currency as keyof typeof prices]
    if (val === 0) return currency === 'usd' ? 'Free' : 'Бесплатно'
    const sym = symbols[currency] ?? '$'
    return currency === 'usd' ? `${sym}${val}` : `${val} ${sym}`
  }

  return {
    currentPlan,
    currency,
    paymentModal,
    paymentResult,
    mockOutcome,
    processing,
    formatPrice,
    openPayment,
    closePayment,
    retryPayment,
    processPayment,
    setMockOutcome,
  }
}
