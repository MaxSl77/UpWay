import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { authApi } from '../api'
import { validateHumanName, validateEmail, validatePassword } from '@/lib/validation'
import type { AxiosError } from 'axios'

export function RegisterForm() {
  const navigate  = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser   = useAuthStore((s) => s.setUser)
  const { language } = useSettingsStore()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  })
  const [loading, setLoading]         = useState(false)
  const [error,   setError]           = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({})

  const t = {
    title:    language === 'ru' ? 'Создать аккаунт'                              : 'Create account',
    subtitle: language === 'ru' ? 'Присоединитесь и начните путь к вершине.'     : 'Join UpWay and start your player\'s journey to the top.',
    fields: [
      { label: language === 'ru' ? 'Полное имя'           : 'Full Name',        key: 'fullName'        as const, type: 'text',     placeholder: language === 'ru' ? 'Андрей Морозов' : 'Andrey Morozov' },
      { label: 'Email',                                                           key: 'email'           as const, type: 'email',    placeholder: 'you@example.com' },
      { label: language === 'ru' ? 'Пароль'               : 'Password',          key: 'password'        as const, type: 'password', placeholder: language === 'ru' ? 'Минимум 8 символов' : 'Min. 8 characters' },
      { label: language === 'ru' ? 'Подтвердите пароль'   : 'Confirm Password',  key: 'confirmPassword' as const, type: 'password', placeholder: language === 'ru' ? 'Повторите пароль'  : 'Repeat your password' },
    ],
    passwordMismatch: language === 'ru' ? 'Пароли не совпадают.'                                       : 'Passwords do not match.',
    emailTaken:       language === 'ru' ? 'Аккаунт с этим email уже существует.'                        : 'An account with this email already exists.',
    errorMsg:         language === 'ru' ? 'Ошибка регистрации. Попробуйте ещё раз.'                     : 'Registration failed. Please try again.',
    submit:   language === 'ru' ? 'Создать аккаунт' : 'Create Account',
    loading:  language === 'ru' ? 'Создаём аккаунт…' : 'Creating account…',
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof typeof form, string>> = {}
    const nameErr  = validateHumanName(form.fullName, language)
    const emailErr = validateEmail(form.email, language)
    const passErr  = validatePassword(form.password, language)
    if (nameErr)  errs.fullName = nameErr
    if (emailErr) errs.email = emailErr
    if (passErr)  errs.password = passErr
    if (form.password !== form.confirmPassword) errs.confirmPassword = t.passwordMismatch
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError(null)
    try {
      const { accessToken, refreshToken, user } = await authApi.register(form)
      setTokens(accessToken, refreshToken)
      setUser(user)
      navigate('/verify-pending', { replace: true })
    } catch (err) {
      const status = (err as AxiosError)?.response?.status
      setError(status === 409 ? t.emailTaken : t.errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
      // Ошибка поля сбрасывается, как только пользователь начал исправлять
      setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
    },
  })

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="font-display text-[22px] font-bold mb-1">{t.title}</h2>
      <p className="text-[13px] text-text-2 mb-6">{t.subtitle}</p>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {t.fields.map(({ label, key, type, placeholder }) => (
        <div key={key} className="mb-4">
          <label className="block text-[12.5px] font-medium text-text-2 mb-1.5">{label}</label>
          <input
            type={type}
            {...field(key)}
            placeholder={placeholder}
            maxLength={key === 'fullName' ? 100 : key === 'email' ? 255 : 128}
            className={`w-full h-[44px] px-3.5 bg-surface2 border rounded-btn text-text text-sm focus:outline-none transition-colors ${
              fieldErrors[key] ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'
            }`}
            required
          />
          {fieldErrors[key] && (
            <p className="text-danger text-[11.5px] mt-1">{fieldErrors[key]}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-[44px] bg-accent text-[#0a1a11] rounded-btn font-bold text-[15px] mt-2 hover:bg-[#30e887] hover:shadow-accent transition-all disabled:opacity-60"
      >
        {loading ? t.loading : t.submit}
      </button>
    </form>
  )
}
