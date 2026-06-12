import { useEffect } from 'react'
import { ChatHistory } from '@/features/chat/components/ChatHistory'
import { ChatWindow } from '@/features/chat/components/ChatWindow'
import { chatApi } from '@/features/chat/api'
import { useChatStore } from '@/store/chatStore'

export default function ChatPage() {
  const { setSessions, setActiveSession, setMessages } = useChatStore()

  useEffect(() => {
    chatApi.getSessions()
      .then(async (all) => {
        setSessions(all)
        if (all.length === 0) return

        // Если нет активной сессии или активная не в списке — выбрать первую
        const ids = new Set(all.map((s) => s.id))
        const currentId = useChatStore.getState().activeSessionId
        if (!currentId || !ids.has(currentId)) {
          setActiveSession(all[0].id)
          try {
            const msgs = await chatApi.getMessages(all[0].id)
            setMessages(msgs)
          } catch {
            setMessages([])
          }
        }
      })
      .catch(() => {})
    // zustand-сеттеры стабильны — эффект должен выполниться один раз при маунте
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-1 overflow-hidden">
      <ChatHistory />
      <ChatWindow />
    </div>
  )
}
