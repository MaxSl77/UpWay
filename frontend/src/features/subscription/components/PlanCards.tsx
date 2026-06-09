import { Check, Zap, Crown, Star } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { PLAN_DEFS } from '../hooks/useSubscription'
import type { PlanId } from '@/types'

interface PlanCardsProps {
  currentPlan: PlanId
  formatPrice: (prices: { rub: number; byn: number; usd: number }) => string
  onSelect: (planId: PlanId) => void
}

const PLAN_ICONS = {
  free:    <Star size={18} />,
  starter: <Zap size={18} />,
  pro:     <Crown size={18} />,
}

const PLAN_COLORS = {
  free:    { ring: 'border-border', badge: '', icon: 'bg-surface3 text-text-2' },
  starter: { ring: 'border-accent', badge: 'bg-accent text-[#0a1a11]', icon: 'bg-accent-dim text-accent' },
  pro:     { ring: 'border-orange', badge: 'bg-orange text-[#1a0a00]', icon: 'bg-orange-dim text-orange' },
}

export function PlanCards({ currentPlan, formatPrice, onSelect }: PlanCardsProps) {
  const { language } = useSettingsStore()

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {PLAN_DEFS.map((plan) => {
        const isCurrent = plan.id === currentPlan
        const isFree    = plan.id === 'free'
        const colors    = PLAN_COLORS[plan.id]
        const name      = language === 'ru' ? plan.nameRu : plan.nameEn
        const features  = language === 'ru' ? plan.featuresRu : plan.featuresEn
        const price     = formatPrice(plan.prices)

        return (
          <div
            key={plan.id}
            className={[
              'relative bg-surface border rounded-card p-5 flex flex-col transition-all',
              isCurrent ? `${colors.ring} shadow-lg` : 'border-border hover:border-text-3',
            ].join(' ')}
          >
            {/* Badge */}
            {plan.badge && (
              <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colors.badge}`}>
                {plan.badge}
              </span>
            )}
            {isCurrent && (
              <span className="absolute top-3 right-3 text-[10px] font-semibold text-accent bg-accent-dim px-2 py-0.5 rounded-full">
                {language === 'ru' ? 'Активен' : 'Active'}
              </span>
            )}

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon}`}>
                {PLAN_ICONS[plan.id]}
              </div>
              <span className="font-display font-bold text-[15px]">{name}</span>
            </div>

            {/* Price */}
            <div className="mb-4">
              <span className="font-display text-2xl font-extrabold">{price}</span>
              {!isFree && (
                <span className="text-text-2 text-[12px] ml-1">
                  /{language === 'ru' ? 'мес' : 'mo'}
                </span>
              )}
            </div>

            {/* Features */}
            <ul className="flex flex-col gap-2 flex-1 mb-5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-text-2">
                  <Check size={13} className="text-accent mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            {isCurrent ? (
              <div className="h-10 rounded-btn border border-accent text-accent text-[13px] font-semibold flex items-center justify-center">
                {language === 'ru' ? '✓ Текущий план' : '✓ Current plan'}
              </div>
            ) : isFree ? (
              <div className="h-10 rounded-btn border border-border text-text-3 text-[13px] flex items-center justify-center">
                {language === 'ru' ? 'Базовый' : 'Basic'}
              </div>
            ) : (
              <button
                onClick={() => onSelect(plan.id)}
                className={[
                  'h-10 rounded-btn font-semibold text-[13px] transition-all',
                  plan.id === 'starter'
                    ? 'bg-accent text-[#0a1a11] hover:bg-[#30e887] hover:shadow-accent'
                    : 'bg-orange text-[#1a0a00] hover:bg-[#ffb84d]',
                ].join(' ')}
              >
                {language === 'ru' ? `Перейти на ${name}` : `Upgrade to ${name}`}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
