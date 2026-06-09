import { useState, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { PlayerProfileHeader } from '@/features/profile/components/PlayerProfileHeader'
import { SkillBars } from '@/features/profile/components/SkillBars'
import { ProfileStats } from '@/features/profile/components/ProfileStats'
import { GoalsCard } from '@/features/profile/components/GoalsCard'
import { UpcomingWeekCard } from '@/features/profile/components/UpcomingWeekCard'
import { NotesBioCard } from '@/features/profile/components/NotesBioCard'
import { ProfileEditModal } from '@/features/profile/components/ProfileEditModal'
import { GenerateReportModal } from '@/features/profile/components/GenerateReportModal'
import { profileApi, type PlayerUpdatePayload } from '@/features/profile/api'
import { usePlayerStore } from '@/store/playerStore'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'

export default function ProfilePage() {
  const { player, setPlayer } = usePlayerStore()
  const [isLoading, setIsLoading] = useState(!player)
  const [error, setError] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)

  // Fetch fresh data on mount
  useEffect(() => {
    profileApi
      .getPlayer()
      .then((data) => {
        setPlayer(data)
        setIsLoading(false)
      })
      .catch(() => {
        setError('Не удалось загрузить профиль')
        setIsLoading(false)
      })
  }, [setPlayer])

  const handleSave = async (payload: PlayerUpdatePayload) => {
    const updated = await profileApi.updatePlayer(payload)
    setPlayer(updated)
  }

  if (isLoading) return <FullPageSpinner />

  if (error || !player) {
    return (
      <>
        <TopBar title="Профиль игрока" />
        <div className="flex-1 flex items-center justify-center text-text-2 text-sm">
          {error ?? 'Профиль не найден'}
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="Профиль игрока" subtitle={player.name} />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Header with avatar, meta, actions */}
        <PlayerProfileHeader
          player={player}
          onEdit={() => setIsEditOpen(true)}
          onReport={() => setIsReportOpen(true)}
        />

        <div className="px-7 py-5 flex flex-col gap-4">
          {/* Row 1: Physical stats */}
          <ProfileStats player={player} />

          {/* Row 2: Skills + Goals */}
          <div className="grid grid-cols-2 gap-4">
            <SkillBars skills={player.skills} />
            <GoalsCard player={player} />
          </div>

          {/* Row 3: Upcoming week + Notes & Bio */}
          <div className="grid grid-cols-2 gap-4">
            <UpcomingWeekCard />
            <NotesBioCard />
          </div>
        </div>
      </div>

      {isEditOpen && (
        <ProfileEditModal
          player={player}
          onSave={handleSave}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {isReportOpen && (
        <GenerateReportModal
          player={player}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </>
  )
}
