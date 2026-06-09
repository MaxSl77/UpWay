import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StepPlayerInfo } from './StepPlayerInfo'
import { StepGeography } from './StepGeography'
import { StepLevel } from './StepLevel'
import { StepGoals } from './StepGoals'
import { StepSkills } from './StepSkills'
import { OnboardingComplete } from './OnboardingComplete'
import type { Player } from '@/types'
import api from '@/lib/api'

const STEPS = [
  { num: 1, title: 'Player Information', sub: 'Tell us about the player you\'re supporting.' },
  { num: 2, title: 'Geography',          sub: 'Where is the player based?' },
  { num: 3, title: 'Current Level',      sub: 'What level is the player at?' },
  { num: 4, title: 'Goals',              sub: 'What are the player\'s ambitions?' },
  { num: 5, title: 'Skills Assessment',  sub: 'Rate each skill honestly.' },
]

type FormData = Partial<Omit<Player, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>

export function OnboardingWizard() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(1)
  const [data, setData]         = useState<FormData>({})
  const [completing, setCompleting] = useState(false)

  const progress = (step / STEPS.length) * 100
  const current  = STEPS[step - 1]

  const updateData = (patch: FormData) => setData((d) => ({ ...d, ...patch }))

  const next = () => {
    if (step < STEPS.length) setStep((s) => s + 1)
    else finish()
  }
  const back = () => setStep((s) => Math.max(1, s - 1))

  const finish = async () => {
    setCompleting(true)
    try {
      await api.post('/players/', data)
      // Wizard auto-completes after a short delay
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch (e) {
      console.error(e)
      setCompleting(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left steps list */}
      <aside className="relative w-[300px] flex-shrink-0 bg-surface border-r border-border flex flex-col p-10 overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-[radial-gradient(circle,rgba(34,214,122,.35)_0%,transparent_65%)] pointer-events-none" />
        <div className="font-display text-[22px] font-extrabold tracking-tight mb-10">
          Up<span className="text-accent">Way</span>
        </div>
        <div className="flex flex-col">
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className={`relative flex items-start gap-3.5 py-3.5 ${i < STEPS.length - 1 ? 'step-connector' : ''}`}
            >
              <div className={`w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 transition-all
                ${step > s.num  ? 'bg-accent border-accent text-[#0a1a11]'           : ''}
                ${step === s.num ? 'border-accent text-accent bg-accent-dim shadow-[0_0_0_4px_rgba(34,214,122,0.15)]' : ''}
                ${step < s.num  ? 'border-border bg-surface2 text-text-3'             : ''}
              `}>
                {step > s.num ? '✓' : s.num}
              </div>
              <div className="mt-0.5">
                <p className="text-[10.5px] text-text-3 font-semibold uppercase tracking-wide">Step {s.num}</p>
                <p className={`text-[13.5px] mt-0.5 font-medium ${step === s.num ? 'text-text font-semibold' : step > s.num ? 'text-text-3' : 'text-text-2'}`}>
                  {s.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden bg-bg">
        {completing ? (
          <OnboardingComplete />
        ) : (
          <>
            <div className="px-12 pt-8 flex-shrink-0">
              <div className="h-[3px] bg-surface3 rounded-sm mb-9">
                <div
                  className="h-full bg-accent rounded-sm transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <h2 className="font-display text-[26px] font-extrabold mb-1.5">{current.title}</h2>
              <p className="text-[14px] text-text-2">{current.sub}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-12 py-7 scrollbar-thin">
              {step === 1 && <StepPlayerInfo data={data} onChange={updateData} />}
              {step === 2 && <StepGeography  data={data} onChange={updateData} />}
              {step === 3 && <StepLevel      data={data} onChange={updateData} />}
              {step === 4 && <StepGoals      data={data} onChange={updateData} />}
              {step === 5 && <StepSkills     data={data} onChange={updateData} />}
            </div>

            <footer className="px-12 py-5 border-t border-border flex items-center justify-between bg-bg flex-shrink-0">
              {step > 1 ? (
                <button
                  onClick={back}
                  className="h-11 px-5 bg-surface2 border border-border rounded-btn text-sm hover:border-accent hover:text-accent transition-colors"
                >
                  ← Back
                </button>
              ) : <div />}
              <p className="text-xs text-text-3">Step {step} of {STEPS.length}</p>
              <button
                onClick={next}
                className="h-11 min-w-[140px] px-5 bg-accent text-[#0a1a11] rounded-btn font-semibold text-sm hover:bg-[#30e887] hover:shadow-accent transition-all"
              >
                {step === STEPS.length ? 'Finish →' : 'Next Step →'}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
