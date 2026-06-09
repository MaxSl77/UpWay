import { Zap } from 'lucide-react'

interface NextStep {
  title: string
  description: string
  ctaLabel?: string
  onCta?: () => void
}

export function NextStepCard({ step }: { step: NextStep }) {
  return (
    <div className="relative bg-surface border border-border rounded-card overflow-hidden">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />

      <div className="pl-7 pr-5 py-5 flex items-center gap-5 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-accent-dim text-accent rounded-full px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide mb-2">
            <Zap size={11} />
            Next Step
          </div>
          <h3 className="font-display text-[19px] font-bold mb-1">{step.title}</h3>
          <p className="text-[13px] text-text-2">{step.description}</p>
        </div>
        {step.onCta && (
          <div className="flex-shrink-0">
            <button
              onClick={step.onCta}
              className="h-[52px] min-w-[200px] px-7 bg-accent text-[#0a1a11] rounded-btn font-bold text-[15px] hover:bg-[#30e887] hover:shadow-accent-lg transition-all"
            >
              {step.ctaLabel ?? 'Take Action →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
