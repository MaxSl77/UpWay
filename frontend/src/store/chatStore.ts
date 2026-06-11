import { create } from 'zustand'
import type { ChatSession, ChatMessage } from '@/types'

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  messages: ChatMessage[]
  messagesLoading: boolean
  /** ID сессии, для которой сейчас идёт запрос к AI (null = не идёт) */
  streamingSessionId: string | null

  setSessions: (sessions: ChatSession[]) => void
  setActiveSession: (id: string) => void
  setMessages: (messages: ChatMessage[]) => void
  setMessagesLoading: (loading: boolean) => void
  appendMessage: (message: ChatMessage) => void
  setStreamingSession: (id: string | null) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  messagesLoading: false,
  streamingSessionId: null,

  setSessions: (sessions) => set({ sessions }),
  setActiveSession: (id) => set((state) => {
    const switching = state.activeSessionId !== id
    return {
      activeSessionId: id,
      messages: switching ? [] : state.messages,
      // loading только при переходе в другую сессию
      messagesLoading: switching,
    }
  }),
  setMessages: (messages) => set({ messages, messagesLoading: false }),
  setMessagesLoading: (messagesLoading) => set({ messagesLoading }),
  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setStreamingSession: (streamingSessionId) => set({ streamingSessionId }),
  reset: () =>
    set({ sessions: [], activeSessionId: null, messages: [], messagesLoading: false, streamingSessionId: null }),
}))
