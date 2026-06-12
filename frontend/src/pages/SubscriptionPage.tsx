import { ShieldCheck, RefreshCcw, Zap } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { PlanCards } from '@/features/subscription/components/PlanCards'
import { PlanComparison } from '@/features/subscription/components/PlanComparison'
import { BillingInfo } from '@/features/subscription/components/BillingInfo'
import { PaymentModal } from '@/features/subscription/components/PaymentModal'
import { useSubscription } from '@/features/subscription/hooks/useSubscription'
import { useSettingsStore } from '@/store/settingsStore'

export default function SubscriptionPage() {
  const { language } = useSettingsStore()
  const ru = language === 'ru'
  const {
    currentPlan, paymentModal, paymentResult, mockOutcome, processing,
    formatPrice, openPayment, closePayment, retryPayment, processPayment, setMockOutcome,
  } = useSubscription()

  const trust = [
    {
      icon: <ShieldCheck size={17} />,
      title: ru ? 'Оплата защищена' : 'Secure payments',
      desc:  ru ? 'Платёжные данные не хранятся на наших серверах' : 'Card details never touch our servers',
    },
    {
      icon: <RefreshCcw size={17} />,
      title: ru ? 'Отмена в любой момент' : 'Cancel anytime',
      desc:  ru ? 'Без скрытых условий — доступ до конца периода' : 'No lock-in — access till the period ends',
    },
    {
      icon: <Zap size={17} />,
      title: ru ? 'Апгрейд мгновенно' : 'Instant upgrade',
      desc:  ru ? 'Роадмап и база знаний откроются сразу после оплаты' : 'Roadmap & knowledge base unlock right away',
    },
  ]

  return (
    <>
      <TopBar
        title={ru ? 'Подписка' : 'Subscription'}
        subtitle={ru ? 'Тарифы и оплата' : 'Plans & billing'}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="relative px-7 pb-20">

          {/* ── Атмосфера: свечение + центральный круг площадки ── */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden" aria-hidden>
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-40 w-[680px] h-[480px] rounded-full opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, var(--color-accent-dim) 0%, transparent 65%)' }}
            />
            {/* Центральный круг хоккейной площадки */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[46px] w-[460px] h-[460px] rounded-full border border-accent/15" />
            <div className="absolute left-1/2 -translate-x-1/2 top-[156px] w-[240px] h-[240px] rounded-full border border-accent/10" />
            <div className="absolute left-0 right-0 top-[275px] h-px bg-gradient-to-r from-transparent via-accent/15 to-transparent" />
          </div>

          {/* ── Hero ── */}
          <header className="relative text-center pt-14 pb-12 animate-fadeSlide">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-accent mb-4">
              {ru ? 'Тарифы UpWay' : 'UpWay pricing'}
            </p>
            <h1 className="font-display text-[34px] md:text-[40px] font-extrabold leading-[1.12] tracking-tight max-w-2xl mx-auto">
              {ru ? (
                <>Инвестиция в хоккейное <span className="text-accent">будущее</span> вашего игрока</>
              ) : (
                <>An investment in your player&rsquo;s hockey <span className="text-accent">future</span></>
              )}
            </h1>
            <p className="text-text-2 text-[14.5px] max-w-xl mx-auto mt-4 leading-relaxed">
              {ru
                ? 'Персональный AI-консультант, роадмап карьеры и база регламентов ФХР/ФХБ — дешевле одной подкачки коньков в месяц.'
                : 'A personal AI consultant, career roadmap and FHR/FHB rulebook knowledge base — for less than one skate sharpening a month.'}
            </p>
          </header>

          {/* ── Карточки тарифов ── */}
          <PlanCards
            currentPlan={currentPlan}
            formatPrice={formatPrice}
            onSelect={openPayment}
          />

          {/* ── Трастовая полоса ── */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mx-auto mt-7 animate-fadeSlide"
            style={{ animationDelay: '140ms', animationFillMode: 'backwards' }}
          >
            {trust.map((item) => (
              <div key={item.title} className="flex items-start gap-3.5 bg-surface/60 border border-border rounded-card px-5 py-4">
                <span className="w-9 h-9 rounded-lg bg-accent-dim text-accent flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </span>
                <span>
                  <p className="text-[13px] font-semibold leading-tight">{item.title}</p>
                  <p className="text-[11.5px] text-text-3 mt-1 leading-snug">{item.desc}</p>
                </span>
              </div>
            ))}
          </div>

          {/* ── Сравнение тарифов ── */}
          <div className="mt-14">
            <PlanComparison />
          </div>

          {/* ── Биллинг ── */}
          <div
            className="w-full max-w-4xl mx-auto mt-14 animate-fadeSlide"
            style={{ animationDelay: '240ms', animationFillMode: 'backwards' }}
          >
            <h2 className="font-display text-[20px] font-bold mb-5 text-center">
              {ru ? 'Ваша подписка' : 'Your subscription'}
            </h2>
            <BillingInfo />
          </div>
        </div>
      </div>

      {paymentModal && (
        <PaymentModal
          planId={paymentModal}
          result={paymentResult}
          mockOutcome={mockOutcome}
          processing={processing}
          formatPrice={formatPrice}
          onOutcomeChange={setMockOutcome}
          onRetry={retryPayment}
          onPay={processPayment}
          onClose={closePayment}
        />
      )}
    </>
  )
}
