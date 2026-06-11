import api from '@/lib/api'
import type { ChatSession, ChatMessage } from '@/types'

export const chatApi = {
  getSessions: async (): Promise<ChatSession[]> => {
    const { data } = await api.get<ChatSession[]>('/chat/sessions')
    return data
  },

  createSession: async (): Promise<ChatSession> => {
    const { data } = await api.post<ChatSession>('/chat/sessions')
    return data
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const { data } = await api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`)
    return data
  },

  /**
   * Send a message and receive the full response.
   * For streaming, use sendMessageStream instead.
   */
  sendMessage: async (sessionId: string, content: string): Promise<ChatMessage> => {
    const { data } = await api.post<ChatMessage>(
      `/chat/sessions/${sessionId}/messages`,
      { content },
    )
    return data
  },

  renameSession: async (sessionId: string, title: string): Promise<ChatSession> => {
    const { data } = await api.patch<ChatSession>(`/chat/sessions/${sessionId}`, { title })
    return data
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/chat/sessions/${sessionId}`)
  },

  /**
   * SSE streaming endpoint — returns a ReadableStream.
   * Caller is responsible for consuming the stream.
   */
  sendMessageStream: (sessionId: string, content: string): EventSource => {
    const token = localStorage.getItem('accessToken') ?? ''
    const url = `/api/v1/chat/sessions/${sessionId}/stream?content=${encodeURIComponent(content)}`
    return new EventSource(url + `&token=${token}`)
  },
}
