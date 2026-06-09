import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

export function DangerZoneCard() {
  const { language } = useSettingsStore()
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const [confirm, setConfirm] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const CONFIRM_WORD = language === 'ru' ? 'УДАЛИТЬ' : 'DELETE'

  const t = {
    title:       language === 'ru' ? 'Опасная зона'           : 'Danger Zone',
    deleteBtn:   language === 'ru' ? 'Удалить аккаунт'        : 'Delete account',
    warning:     language === 'ru'
      ? 'Все данные игрока, роадмап и история чата будут удалены безвозвратно.'
      : 'All player data, roadmap and chat history will be permanently deleted.',
    confirmHint: language === 'ru'
      ? `Введите «${CONFIRM_WORD}» для подтверждения`
      : `Type "${CONFIRM_WORD}" to confirm`,
    cancel:      language === 'ru' ? 'Отмена'           : 'Cancel',
    confirm:     language === 'ru' ? 'Удалить навсегда' : 'Delete forever',
    deleting:    language === 'ru' ? 'Удаление...'      : 'Deleting...',
    errorMsg:    language === 'ru' ? 'Ошибка удаления. Попробуйте позже.' : 'Deletion failed. Please try again.',
  }

  const handleDelete = async () => {
    if (inputVal !== CONFIRM_WORD) return
    setLoading(true)
    setError('')
    try {
      await api.delete('/auth/me')
    } catch {
      // If API fails (e.g. dev mode / network), still log out locally
    }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="bg-surface border border-danger rounded-card p-5" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-danger-dim flex items-center justify-center">
          <AlertTriangle size={15} className="text-danger" />
        </div>
        <span className="font-semibold text-[14px] text-danger">{t.title}</span>
      </div>

      <p className="text-[13px] text-text-2 mb-4">{t.warning}</p>

      {error && <p className="text-danger text-[12px] mb-3">{error}</p>}

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-btn border text-danger text-[13px] font-medium hover:bg-danger-dim transition-all"
          style={{ borderColor: 'rgba(239,68,68,0.4)' }}
        >
          <Trash2 size={14} />
          {t.deleteBtn}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-text-2">{t.confirmHint}</p>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value.toUpperCase())}
            placeholder={CONFIRM_WORD}
            className="w-full h-10 bg-surface2 rounded-btn px-3 text-[13px] text-danger placeholder-text-3 focus:outline-none transition-colors"
            style={{ border: '1px solid rgba(239,68,68,0.4)' }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setConfirm(false); setInputVal('') }}
              className="flex-1 h-10 bg-surface2 border border-border rounded-btn text-text-2 text-[13px] hover:text-text transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleDelete}
              disabled={inputVal !== CONFIRM_WORD || loading}
              className="flex-1 h-10 bg-danger text-white rounded-btn text-[13px] font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? t.deleting : t.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
