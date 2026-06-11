import { useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { chatApi } from '../api'
import type { ChatMessage } from '@/types'

export function useChat() {
  const {
    activeSessionId,
    appendMessage,
    setStreamingSession,
    setSessions,
    setActiveSession,
    setMessages,
  } = useChatStore()

  const [input, setInput] = useState('')

  const loadMessages = async (sessionId: string) => {
    try {
      const msgs = await chatApi.getMessages(sessionId)
      setMessages(msgs)
    } catch {
      setMessages([])
    }
  }

  const selectSession = (id: string) => {
    setActiveSession(id)
    loadMessages(id)
  }

  const createSession = async () => {
    const session = await chatApi.createSession()
    const all = await chatApi.getSessions()
    setSessions(all)
    setActiveSession(session.id)
    setMessages([])
  }

  const deleteSession = async (sessionId: string) => {
    await chatApi.deleteSession(sessionId)
    const all = await chatApi.getSessions()
    setSessions(all)
    // Если удалили активную — переходим в первую оставшуюся или очищаем
    const current = useChatStore.getState().activeSessionId
    if (current === sessionId) {
      if (all.length > 0) {
        setActiveSession(all[0].id)
        loadMessages(all[0].id)
      } else {
        setActiveSession('')
        setMessages([])
      }
    }
  }

  const renameSession = async (sessionId: string, title: string) => {
    await chatApi.renameSession(sessionId, title)
    const all = await chatApi.getSessions()
    setSessions(all)
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeSessionId) return

    // Фиксируем сессию в момент отправки — closure-изоляция от переключений
    const sessionId = activeSessionId

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId,
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    appendMessage(userMsg)
    setInput('')
    setStreamingSession(sessionId)

    try {
      const aiMsg = await chatApi.sendMessage(sessionId, userMsg.content)

      // Добавляем ответ только если пользователь всё ещё в той же сессии
      // (иначе бэкенд уже сохранил — увидит при возврате через loadMessages)
      if (useChatStore.getState().activeSessionId === sessionId) {
        appendMessage(aiMsg)
      }

      // Обновляем список сессий (заголовок обновляется после первого сообщения)
      chatApi.getSessions().then(setSessions).catch(() => {})
    } catch {
      if (useChatStore.getState().activeSessionId === sessionId) {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sessionId,
          role: 'assistant',
          content: '⚠️ Ошибка соединения с AI. Проверьте API ключ OpenRouter в настройках.',
          createdAt: new Date().toISOString(),
        }
        appendMessage(errorMsg)
      }
    } finally {
      setStreamingSession(null)
    }
  }

  return { input, setInput, sendMessage, createSession, selectSession, deleteSession, renameSession }
}
