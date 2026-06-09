import { X, CreditCard, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { PLAN_DEFS } from '../hooks/useSubscription'
import type { PlanId } from '@/types'
import type { PaymentResult } from '../hooks/useSubscription'

interface PaymentModalProps {
  planId: PlanId
  result: PaymentResult
  mockOutcome: 'success' | 'failure'
  processing: boolean
  formatPrice: (prices: { rub: number; byn: number; usd: number }) => string
  onOutcomeChange: (v: 'success' | 'failure') => void
  onRetry: () => void
  onPay: () => void
  onClose: () => void
}

export function PaymentModal({
  planId, result, mockOutcome, processing, formatPrice,
  onOutcomeChange, onRetry, onPay, onClose,
}: PaymentModalProps) {
  const { language } = useSettingsStore()
  const plan  = PLAN_DEFS.find((p) => p.id === planId)!
  const name  = language === 'ru' ? plan.nameRu : plan.nameEn
  const price = formatPrice(plan.prices)

  const t = {
    title:        language === 'ru' ? 'Оформление подписки'           : 'Subscribe',
    plan:         language === 'ru' ? 'Выбранный план'                 : 'Selected plan',
    amount:       language === 'ru' ? 'К оплате'                      : 'Amount',
    perMonth:     language === 'ru' ? '/мес'                          : '/mo',
    devMode:      language === 'ru' ? '⚠ Тестовый режим — выберите результат' : '⚠ Test mode — pick outcome',
    cardNumber:   language === 'ru' ? 'Номер карты'                   : 'Card number',
    expiry:       language === 'ru' ? 'Срок'                          : 'Expiry',
    pay:          language === 'ru' ? `Оплатить ${price}`             : `Pay ${price}`,
    processing:   language === 'ru' ? 'Обрабатывается...'             : 'Processing...',
    successTitle: language === 'ru' ? 'Оплата прошла успешно!'        : 'Payment successful!',
    successSub:   language === 'ru' ? `Подписка «${name}» активирована` : `${name} plan is now active`,
    failTitle:    language === 'ru' ? 'Ошибка оплаты'                 : 'Payment failed',
    failSub:      language === 'ru' ? 'Карта отклонена. Попробуйте другой способ.' : 'Card declined. Try a different method.',
    retry:        language === 'ru' ? 'Попробовать ещё раз'           : 'Try again',
    close:        language === 'ru' ? 'Закрыть'                       : 'Close',
    done:         language === 'ru' ? 'Готово'                        : 'Done',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-[420px] mx-4 animate-fadeSlide shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <CreditCard size={16} className="text-accent" />
            <span className="font-semibold text-[14px]">{t.title}</span>
          </div>
          <button onClick={onClose} className="text-text-3 hover:text-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* ── Success screen ── */}
          {result === 'success' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-accent-dim flex items-center justify-center mb-4 animate-popIn" style={{ border: '2px solid var(--color-accent)' }}>
                <CheckCircle2 size={28} className="text-accent" />
              </div>
              <h3 className="font-display font-extrabold text-xl mb-1">{t.successTitle}</h3>
              <p className="text-text-2 text-[13px] mb-6">{t.successSub}</p>
              <button
                onClick={onClose}
                className="w-full h-11 bg-accent text-[#0a1a11] rounded-btn font-bold text-[14px] hover:opacity-90 hover:shadow-accent transition-all"
              >
                {t.done}
              </button>
            </div>
          )}

          {/* ── Failure screen ── */}
          {result === 'failure' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-danger-dim flex items-center justify-center mb-4 animate-popIn" style={{ border: '2px solid var(--color-danger)' }}>
                <XCircle size={28} className="text-danger" />
              </div>
              <h3 className="font-display font-extrabold text-xl mb-1">{t.failTitle}</h3>
              <p className="text-text-2 text-[13px] mb-6">{t.failSub}</p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 h-11 border border-border rounded-btn text-text-2 text-[13px] hover:text-text transition-colors"
                >
                  {t.close}
                </button>
                <button
                  onClick={onRetry}
                  className="flex-1 h-11 bg-accent text-[#0a1a11] rounded-btn font-bold text-[13px] hover:opacity-90 transition-all"
                >
                  {t.retry}
                </button>
              </div>
            </div>
          )}

          {/* ── Payment form ── */}
          {!result && (
            <>
              <div className="bg-surface2 rounded-btn p-3 flex justify-between items-center mb-4">
                <div>
                  <p className="text-[11px] text-text-2">{t.plan}</p>
                  <p className="font-semibold text-[14px]">{name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-text-2">{t.amount}</p>
                  <p className="font-display font-bold text-[16px]">
                    {price}<span className="text-[12px] font-normal text-text-2">{t.perMonth}</span>
                  </p>
                </div>
              </div>

              <div className="bg-orange-dim rounded-btn p-3 mb-4" style={{ border: '1px solid rgba(245,158,58,0.3)' }}>
                <p className="text-[11px] text-orange font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle size={11} />
                  {t.devMode}
                </p>
                <div className="flex gap-2">
                  {(['success', 'failure'] as const).map((outcome) => (
                    <button
                      key={outcome}
                      onClick={() => onOutcomeChange(outcome)}
                      className={[
                        'flex-1 h-8 rounded-btn border text-[12px] font-medium transition-all',
                        mockOutcome === outcome
                          ? outcome === 'success'
                            ? 'bg-accent-dim border-accent text-accent'
                            : 'bg-danger-dim border-danger text-danger'
                          : 'bg-surface3 border-border text-text-2',
                      ].join(' ')}
                    >
                      {outcome === 'success'
                        ? (language === 'ru' ? '✓ Успех'  : '✓ Success')
                        : (language === 'ru' ? '✗ Ошибка' : '✗ Failure')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mb-4">
                <div>
                  <p className="text-[11px] text-text-2 mb-1">{t.cardNumber}</p>
                  <input readOnly value="4242 4242 4242 4242"
                    className="w-full h-10 bg-surface2 border border-border rounded-btn px-3 text-[13px] text-text-2 cursor-default"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <p className="text-[11px] text-text-2 mb-1">{t.expiry}</p>
                    <input readOnly value="12/28"
                      className="w-full h-10 bg-surface2 border border-border rounded-btn px-3 text-[13px] text-text-2 cursor-default"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-text-2 mb-1">CVC</p>
                    <input readOnly value="•••"
                      className="w-full h-10 bg-surface2 border border-border rounded-btn px-3 text-[13px] text-text-2 cursor-default"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={onPay}
                disabled={processing}
                className="w-full h-11 bg-accent text-[#0a1a11] rounded-btn font-bold text-[14px] hover:opacity-90 hover:shadow-accent transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <><Loader2 size={16} className="animate-spin" />{t.processing}</>
                ) : t.pay}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
