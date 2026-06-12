import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PaymentPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const plan = params.get('plan') ?? 'Starter'

  return (
    <div className="flex-1 flex items-center justify-center bg-bg">
      <div className="bg-surface border border-border rounded-2xl p-12 max-w-[480px] w-full text-center animate-fadeSlide">
        <div className="w-[72px] h-[72px] rounded-full bg-accent-dim border-2 border-accent flex items-center justify-center text-[28px] mx-auto mb-6 animate-popIn">
          ✓
        </div>
        <h2 className="font-display text-2xl font-extrabold mb-2">Payment Successful!</h2>
        <p className="text-text-2 text-sm mb-6">
          Your <strong className="text-text">{plan}</strong> plan is now active.
        </p>

        {/* Receipt */}
        <div className="bg-surface2 rounded-xl p-4 text-left mb-6 text-[13.5px]">
          <div className="flex justify-between py-2">
            <span className="text-text-2">Plan</span>
            <span className="font-semibold">{plan}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-border">
            <span className="text-text-2">Status</span>
            <span className="font-semibold text-accent">Active</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full h-[52px] bg-accent text-[#0a1a11] rounded-btn font-bold text-[15px] hover:bg-[#30e887] hover:shadow-accent transition-all"
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  )
}
