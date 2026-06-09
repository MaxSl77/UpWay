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
      'AI-чат (5 сообщений/день)',
      'Базовый роадмап (3 этапа)',
      'Дашборд с метриками',
      'Календарь событий',
    ],
    featuresEn: [
      'AI chat (5 messages/day)',
      'Basic roadmap (3 milestones)',
      'Metrics dashboard',
      'Event calendar',
    ],
  },
  {
    id: 'starter',
    nameRu: 'Старт',
    nameEn: 'Starter',
    prices: { rub: 890, byn: 29, usd: 9 },
    badge: 'Popular',
    featuresRu: [
      'AI-чат без ограничений',
      'Полный роадмап (12+ этапов)',
      'RAG база знаний МХЛ/ВХЛ',
      'Уведомления о возможностях',
    ],
    featuresEn: [
      'Unlimited AI chat',
      'Full roadmap (12+ milestones)',
      'MHL/VHL knowledge base RAG',
      'Opportunity alerts',
    ],
  },
  {
    id: 'pro',
    nameRu: 'Про',
    nameEn: 'Pro',
    prices: { rub: 1890, byn: 59, usd: 19 },
    featuresRu: [
      'Всё из Старт',
      'Приоритетная обработка AI',
      'Скаутинг-аналитика игрока',
      'Видео-разборы тренировок',
      'Персональный консультант',
    ],
    featuresEn: [
      'Everything in Starter',
      'Priority AI processing',
      'Player scouting analytics',
      'Training video analysis',
      'Personal consultant',
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
