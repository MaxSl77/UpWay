import { TopBar } from '@/components/layout/TopBar'
import { PlanCards } from '@/features/subscription/components/PlanCards'
import { BillingInfo } from '@/features/subscription/components/BillingInfo'
import { PaymentModal } from '@/features/subscription/components/PaymentModal'
import { useSubscription } from '@/features/subscription/hooks/useSubscription'
import { useSettingsStore } from '@/store/settingsStore'

export default function SubscriptionPage() {
  const { language } = useSettingsStore()
  const {
    currentPlan, paymentModal, paymentResult, mockOutcome, processing,
    formatPrice, openPayment, closePayment, retryPayment, processPayment, setMockOutcome,
  } = useSubscription()

  const title    = language === 'ru' ? 'Подписка' : 'Subscription'
  const subtitle = language === 'ru' ? 'Выберите план для вашего хоккеиста' : 'Choose the right plan for your player'

  return (
    <>
      <TopBar title={title} subtitle={subtitle} />
      <div className="flex-1 overflow-y-auto px-7 py-6 pb-16 scrollbar-thin flex flex-col items-center gap-6">
        <PlanCards
          currentPlan={currentPlan}
          formatPrice={formatPrice}
          onSelect={openPayment}
        />
        <BillingInfo />
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
