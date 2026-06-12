import { MessageSquare, BookOpen, Map, Calendar, FileText, LayoutDashboard, Minus, Check } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'

interface Row {
  icon: React.ReactNode
  labelRu: string
  labelEn: string
  free: string | boolean
  starter: string | boolean
  freeEn?: string
  starterEn?: string
}

// Значения должны совпадать с матрицей лимитов backend/app/api/deps.py
const ROWS: Row[] = [
  {
    icon: <MessageSquare size={15} />,
    labelRu: 'AI-консультант', labelEn: 'AI consultant',
    free: '10 сообщений/день', freeEn: '10 messages/day',
    starter: '30 сообщений/день', starterEn: '30 messages/day',
  },
  {
    icon: <BookOpen size={15} />,
    labelRu: 'База знаний ФХР/ФХБ (RAG)', labelEn: 'FHR/FHB knowledge base (RAG)',
    free: false,
    starter: true,
  },
  {
    icon: <Map size={15} />,
    labelRu: 'Роадмап карьеры', labelEn: 'Career roadmap',
    free: false,
    starter: '3 фазы × 3 этапа', starterEn: '3 phases × 3 milestones',
  },
  {
    icon: <Calendar size={15} />,
    labelRu: 'Календарь событий', labelEn: 'Events calendar',
    free: '5 событий всего', freeEn: '5 events total',
    starter: 'Безлимит · до 5/день', starterEn: 'Unlimited · up to 5/day',
  },
  {
    icon: <FileText size={15} />,
    labelRu: 'PDF-отчёт о развитии', labelEn: 'Development PDF report',
    free: false,
    starter: true,
  },
  {
    icon: <LayoutDashboard size={15} />,
    labelRu: 'Дашборд с метриками', labelEn: 'Metrics dashboard',
    free: true,
    starter: true,
  },
]

function Cell({ value, valueEn, ru, highlight }: {
  value: string | boolean
  valueEn?: string
  ru: boolean
  highlight?: boolean
}) {
  if (value === true) {
    return (
      <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center ${highlight ? 'bg-accent-dim text-accent' : 'bg-surface3 text-text-2'}`}>
        <Check size={12} strokeWidth={3} />
      </span>
    )
  }
  if (value === false) {
    return <Minus size={14} className="text-text-3 inline-block" />
  }
  return (
    <span className={`text-[13px] font-medium ${highlight ? 'text-accent' : 'text-text-2'}`}>
      {ru ? value : (valueEn ?? value)}
    </span>
  )
}

export function PlanComparison() {
  const { language } = useSettingsStore()
  const ru = language === 'ru'

  return (
    <section
      className="w-full max-w-4xl mx-auto animate-fadeSlide"
      style={{ animationDelay: '180ms', animationFillMode: 'backwards' }}
    >
      <h2 className="font-display text-[20px] font-bold mb-5 text-center">
        {ru ? 'Что входит в тарифы' : 'Compare plans'}
      </h2>

      <div className="bg-surface border border-border rounded-card overflow-hidden">
        {/* Шапка */}
        <div className="grid grid-cols-[1.6fr_1fr_1fr] px-7 py-4 border-b border-border bg-surface2/60">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-text-3 self-center">
            {ru ? 'Возможность' : 'Feature'}
          </span>
          <span className="text-[13px] font-bold text-center text-text-2">Free</span>
          <span className="text-[13px] font-bold text-center text-accent">
            {ru ? 'Старт' : 'Starter'}
          </span>
        </div>

        {ROWS.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[1.6fr_1fr_1fr] items-center px-7 py-4 border-b border-border last:border-0"
          >
            <span className="flex items-center gap-3 text-[13.5px] text-text">
              <span className="text-text-3">{row.icon}</span>
              {ru ? row.labelRu : row.labelEn}
            </span>
            <span className="text-center">
              <Cell value={row.free} valueEn={row.freeEn} ru={ru} />
            </span>
            <span className="text-center rounded-lg py-1.5 bg-accent-dim/40">
              <Cell value={row.starter} valueEn={row.starterEn} ru={ru} highlight />
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
