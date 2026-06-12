import { Check, Zap, Star } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { PLAN_DEFS } from '../hooks/useSubscription'
import type { PlanId } from '@/types'

interface PlanCardsProps {
  currentPlan: PlanId
  formatPrice: (prices: { rub: number; byn: number; usd: number }) => string
  onSelect: (planId: PlanId) => void
  /** Открывает подтверждение отмены подписки (возврат на free) */
  onCancel?: () => void
}

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
  free:    <Star size={20} />,
  starter: <Zap size={20} />,
}

export function PlanCards({ currentPlan, formatPrice, onSelect, onCancel }: PlanCardsProps) {
  const { language } = useSettingsStore()
  const ru = language === 'ru'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-7 w-full max-w-4xl mx-auto items-stretch">
      {PLAN_DEFS.map((plan, idx) => {
        const isCurrent = plan.id === currentPlan
        const isFree    = plan.id === 'free'
        const featured  = plan.id === 'starter'
        const name      = ru ? plan.nameRu : plan.nameEn
        const features  = ru ? plan.featuresRu : plan.featuresEn
        const price     = formatPrice(plan.prices)

        return (
          <div
            key={plan.id}
            className={[
              'relative flex flex-col rounded-card border-2 p-9 pt-10 animate-fadeSlide',
              featured
                ? 'border-accent bg-surface shadow-accent-lg md:-translate-y-2'
                : 'border-border bg-surface/70 hover:border-text-3 transition-colors',
            ].join(' ')}
            style={{ animationDelay: `${idx * 90}ms`, animationFillMode: 'backwards' }}
          >
            {/* Верхняя акцент-кромка у рекомендуемого плана */}
            {featured && (
              <div
                className="absolute inset-x-8 top-0 h-[3px] rounded-b-full"
                style={{ background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)' }}
              />
            )}

            {/* Badge */}
            {plan.badge && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11.5px] font-bold whitespace-nowrap bg-accent text-[#0a1a11] shadow-accent">
                {plan.badge}
              </span>
            )}
            {isCurrent && (
              <span className="absolute top-4 right-4 text-[10.5px] font-semibold text-accent bg-accent-dim px-2.5 py-1 rounded-full">
                {ru ? '● Активен' : '● Active'}
              </span>
            )}

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-7">
              <div
                className={[
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  featured ? 'bg-accent-dim text-accent' : 'bg-surface3 text-text-2',
                ].join(' ')}
              >
                {PLAN_ICONS[plan.id]}
              </div>
              <div>
                <p className="font-display font-bold text-[19px] leading-tight">{name}</p>
                <p className="text-[12px] text-text-3 mt-0.5">
                  {isFree
                    ? (ru ? 'Чтобы попробовать' : 'To get started')
                    : (ru ? 'Для серьёзного роста' : 'For serious growth')}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-8 flex items-end gap-2">
              <span className="font-display text-[44px] leading-none font-extrabold tracking-tight">
                {price}
              </span>
              {!isFree && (
                <span className="text-text-2 text-[13px] mb-1.5">/{ru ? 'мес' : 'mo'}</span>
              )}
            </div>

            <div className="h-px bg-border mb-7" />

            {/* Features */}
            <ul className="flex flex-col gap-4 flex-1 mb-9">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-[13.5px] text-text-2 leading-snug">
                  <span
                    className={[
                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-px',
                      featured ? 'bg-accent-dim text-accent' : 'bg-surface3 text-text-2',
                    ].join(' ')}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            {isCurrent ? (
              <div className="h-btn-lg rounded-btn border border-accent text-accent text-[14px] font-semibold flex items-center justify-center gap-2">
                <Check size={15} strokeWidth={3} />
                {ru ? 'Текущий план' : 'Current plan'}
              </div>
            ) : isFree ? (
              // Пользователь на платном тарифе: карточка Free — это «вернуться назад»
              <button
                onClick={onCancel}
                className="h-btn-lg rounded-btn border border-border text-text-2 text-[13.5px] font-medium hover:border-danger/60 hover:text-danger transition-colors"
              >
                {ru ? 'Вернуться на Бесплатный' : 'Switch back to Free'}
              </button>
            ) : (
              <button
                onClick={() => onSelect(plan.id)}
                className="h-btn-lg rounded-btn font-bold text-[15px] bg-accent text-[#0a1a11] hover:bg-[#30e887] hover:shadow-accent transition-all"
              >
                {ru ? `Перейти на «${name}»` : `Upgrade to ${name}`}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
