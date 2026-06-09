import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '../api'
import api from '@/lib/api'

export function LoginForm() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser   = useAuthStore((s) => s.setUser)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { accessToken, refreshToken, user } = await authApi.login(email, password)
      setTokens(accessToken, refreshToken)
      setUser(user)

      // Check if player profile already exists → dashboard, else onboarding
      try {
        await api.get('/players/me')
        navigate('/dashboard', { replace: true })
      } catch {
        navigate('/onboarding', { replace: true })
      }
    } catch {
      setError('Неверный email или пароль.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="font-display text-[22px] font-bold mb-1">Добро пожаловать</h2>
      <p className="text-[13px] text-text-2 mb-6">Войдите, чтобы продолжить.</p>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      <div className="mb-4">
        <label className="block text-[12.5px] font-medium text-text-2 mb-1.5">Email</label>
        <input
          type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[44px] px-3.5 bg-surface2 border border-border rounded-btn text-text text-sm focus:outline-none focus:border-accent transition-colors"
          placeholder="you@example.com" required
        />
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-[12.5px] font-medium text-text-2">Пароль</label>
          <Link to="/recovery" className="text-[12px] text-accent">Забыли пароль?</Link>
        </div>
        <input
          type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-[44px] px-3.5 bg-surface2 border border-border rounded-btn text-text text-sm focus:outline-none focus:border-accent transition-colors"
          placeholder="••••••••" required
        />
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full h-[44px] bg-accent text-[#0a1a11] rounded-btn font-bold text-[15px] mt-2 hover:bg-[#30e887] hover:shadow-accent transition-all disabled:opacity-60"
      >
        {loading ? 'Входим…' : 'Войти'}
      </button>
    </form>
  )
}
