import { useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { chatApi } from '../api'
import type { ChatMessage } from '@/types'

export function useChat() {
  const {
    activeSessionId,
    appendMessage,
    setStreaming,
    setSessions,
    setActiveSession,
  } = useChatStore()

  const [input, setInput] = useState('')

  const createSession = async () => {
    const session = await chatApi.createSession()
    const all = await chatApi.getSessions()
    setSessions(all)
    setActiveSession(session.id)
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeSessionId) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: activeSessionId,
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    appendMessage(userMsg)
    setInput('')
    setStreaming(true)

    try {
      const aiMsg = await chatApi.sendMessage(activeSessionId, userMsg.content)
      appendMessage(aiMsg)
    } finally {
      setStreaming(false)
    }
  }

  return { input, setInput, sendMessage, createSession }
}
