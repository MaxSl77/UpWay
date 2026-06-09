export function OnboardingComplete() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-12 gap-5">
      <div className="w-[72px] h-[72px] rounded-full bg-accent-dim border-2 border-accent flex items-center justify-center text-[28px] animate-popIn">✓</div>
      <h2 className="font-display text-[28px] font-extrabold">Plan is ready!</h2>
      <p className="text-[15px] text-text-2 max-w-[400px] leading-relaxed">
        We've built a personalized development roadmap for your player.
      </p>
    </div>
  )
}
