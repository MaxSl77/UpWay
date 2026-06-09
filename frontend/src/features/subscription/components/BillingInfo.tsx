import { CreditCard, Calendar, FileText } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { PLAN_DEFS } from '../hooks/useSubscription'
import type { PlanId } from '@/types'

const PLAN_NAMES_RU: Record<PlanId, string> = {
  free: 'Бесплатный',
  starter: 'Старт',
  pro: 'Про',
}
const PLAN_NAMES_EN: Record<PlanId, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
}

export function BillingInfo() {
  const user = useAuthStore((s) => s.user)
  const { language, currency } = useSettingsStore()

  const plan = (user?.plan ?? 'free') as PlanId
  const planDef = PLAN_DEFS.find((p) => p.id === plan)!
  const planName = language === 'ru' ? PLAN_NAMES_RU[plan] : PLAN_NAMES_EN[plan]
  const isFree = plan === 'free'

  const symbols: Record<string, string> = { rub: '₽', byn: 'Br', usd: '$' }
  const price = planDef.prices[currency as keyof typeof planDef.prices]
  const sym = symbols[currency] ?? '$'
  const priceStr = isFree
    ? (language === 'ru' ? 'Бесплатно' : 'Free')
    : currency === 'usd' ? `${sym}${price}` : `${price} ${sym}`

  const t = {
    title:    language === 'ru' ? 'Информация о подписке' : 'Billing information',
    current:  language === 'ru' ? 'Текущий план' : 'Current plan',
    monthly:  language === 'ru' ? 'Ежемесячный платёж' : 'Monthly payment',
    next:     language === 'ru' ? 'Следующий платёж' : 'Next billing date',
    method:   language === 'ru' ? 'Способ оплаты' : 'Payment method',
    noMethod: language === 'ru' ? 'Не добавлен' : 'Not added',
    noDate:   language === 'ru' ? 'Нет' : 'None',
    perMonth: language === 'ru' ? '/мес' : '/mo',
  }

  const rows = [
    { icon: <FileText size={14} />,   label: t.current,  value: planName },
    { icon: <CreditCard size={14} />, label: t.monthly,  value: isFree ? priceStr : `${priceStr}${t.perMonth}` },
    { icon: <Calendar size={14} />,   label: t.next,     value: isFree ? t.noDate : '5 июля 2026' },
    { icon: <CreditCard size={14} />, label: t.method,   value: isFree ? t.noMethod : '•••• 4242' },
  ]

  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <h3 className="font-semibold text-[14px] mb-4">{t.title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="bg-surface2 rounded-btn p-3 flex items-start gap-2.5">
            <span className="text-text-3 mt-0.5 flex-shrink-0">{row.icon}</span>
            <div>
              <p className="text-[11px] text-text-2">{row.label}</p>
              <p className="text-[13px] font-semibold mt-0.5">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
