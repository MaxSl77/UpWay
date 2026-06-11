import { Check, Zap, Star } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { PLAN_DEFS } from '../hooks/useSubscription'
import type { PlanId } from '@/types'

interface PlanCardsProps {
  currentPlan: PlanId
  formatPrice: (prices: { rub: number; byn: number; usd: number }) => string
  onSelect: (planId: PlanId) => void
}

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
  free:    <Star size={18} />,
  starter: <Zap size={18} />,
}

const PLAN_COLORS: Record<PlanId, { ring: string; icon: string; badge: string }> = {
  free:    { ring: 'border-border',  icon: 'bg-surface3 text-text-2',    badge: '' },
  starter: { ring: 'border-accent',  icon: 'bg-accent-dim text-accent',  badge: 'bg-accent text-[#0a1a11]' },
}

export function PlanCards({ currentPlan, formatPrice, onSelect }: PlanCardsProps) {
  const { language } = useSettingsStore()

  return (
    <div className="grid grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
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
              'relative bg-surface border-2 rounded-card p-8 flex flex-col transition-all',
              isCurrent ? `${colors.ring} shadow-lg` : 'border-border hover:border-text-3',
            ].join(' ')}
          >
            {/* Badge */}
            {plan.badge && (
              <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${colors.badge}`}>
                {plan.badge}
              </span>
            )}
            {isCurrent && (
              <span className="absolute top-3 right-3 text-[10px] font-semibold text-accent bg-accent-dim px-2 py-0.5 rounded-full">
                {language === 'ru' ? 'Активен' : 'Active'}
              </span>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.icon}`}>
                {PLAN_ICONS[plan.id]}
              </div>
              <span className="font-display font-bold text-[18px]">{name}</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="font-display text-4xl font-extrabold">{price}</span>
              {!isFree && (
                <span className="text-text-2 text-[13px] ml-1.5">
                  /{language === 'ru' ? 'мес' : 'mo'}
                </span>
              )}
            </div>

            {/* Features */}
            <ul className="flex flex-col gap-3 flex-1 mb-7">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-text-2">
                  <Check size={15} className="text-accent mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            {isCurrent ? (
              <div className="h-12 rounded-btn border border-accent text-accent text-[14px] font-semibold flex items-center justify-center">
                {language === 'ru' ? '✓ Текущий план' : '✓ Current plan'}
              </div>
            ) : isFree ? (
              <div className="h-12 rounded-btn border border-border text-text-3 text-[13px] flex items-center justify-center">
                {language === 'ru' ? 'Базовый' : 'Basic'}
              </div>
            ) : (
              <button
                onClick={() => onSelect(plan.id)}
                className="h-12 rounded-btn font-semibold text-[14px] bg-accent text-[#0a1a11] hover:bg-[#30e887] hover:shadow-accent transition-all"
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
