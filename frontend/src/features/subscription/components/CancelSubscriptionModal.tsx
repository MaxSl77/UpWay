import { AlertTriangle, X } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'

interface Props {
  cancelling: boolean
  onConfirm: () => void
  onClose: () => void
}

export function CancelSubscriptionModal({ cancelling, onConfirm, onClose }: Props) {
  const { language } = useSettingsStore()
  const ru = language === 'ru'

  const losses = ru
    ? [
        'Роадмап карьеры (3 фазы × 3 этапа)',
        'База знаний ФХР/ФХБ в AI-чате',
        'AI-чат сократится до 10 сообщений/день',
        'Календарь: лимит 5 событий всего',
        'Экспорт PDF-отчёта',
      ]
    : [
        'Career roadmap (3 phases × 3 milestones)',
        'FHR/FHB knowledge base in AI chat',
        'AI chat drops to 10 messages/day',
        'Calendar: 5 events total limit',
        'PDF report export',
      ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-card w-full max-w-md shadow-xl overflow-hidden animate-popIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-danger-dim text-danger flex items-center justify-center">
              <AlertTriangle size={15} />
            </span>
            <h2 className="font-display text-[15px] font-bold">
              {ru ? 'Отменить подписку?' : 'Cancel subscription?'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-3 hover:text-text hover:bg-surface2 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-[13.5px] text-text-2 mb-4 leading-relaxed">
            {ru
              ? 'Вы вернётесь на бесплатный тариф и потеряете доступ к:'
              : 'You will return to the Free plan and lose access to:'}
          </p>
          <ul className="flex flex-col gap-2 mb-5">
            {losses.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] text-text-2">
                <span className="text-danger mt-px flex-shrink-0">✕</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="bg-surface2 border border-border rounded-btn px-4 py-3">
            <p className="text-[12px] text-text-2 leading-relaxed">
              {ru
                ? 'Ваши данные (роадмап, история чатов, события) не удаляются — при повторном переходе на «Старт» всё вернётся на место.'
                : 'Your data (roadmap, chat history, events) is not deleted — everything comes back if you upgrade again.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2.5 justify-end">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-btn bg-accent text-[#0a1a11] text-sm font-semibold hover:bg-[#30e887] transition-all"
          >
            {ru ? 'Оставить подписку' : 'Keep subscription'}
          </button>
          <button
            onClick={onConfirm}
            disabled={cancelling}
            className="h-10 px-4 rounded-btn border border-danger/60 text-danger text-sm font-medium hover:bg-danger-dim transition-all disabled:opacity-50"
          >
            {cancelling
              ? (ru ? 'Отменяем…' : 'Cancelling…')
              : (ru ? 'Отменить подписку' : 'Cancel subscription')}
          </button>
        </div>
      </div>
    </div>
  )
}
