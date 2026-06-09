import { create } from 'zustand'
import type { ChatSession, ChatMessage } from '@/types'

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  messages: ChatMessage[]
  isStreaming: boolean

  setSessions: (sessions: ChatSession[]) => void
  setActiveSession: (id: string) => void
  setMessages: (messages: ChatMessage[]) => void
  appendMessage: (message: ChatMessage) => void
  setStreaming: (streaming: boolean) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,

  setSessions: (sessions) => set({ sessions }),
  setActiveSession: (id) => set({ activeSessionId: id, messages: [] }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  reset: () =>
    set({ sessions: [], activeSessionId: null, messages: [], isStreaming: false }),
}))
