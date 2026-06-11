import { useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { useChatStore } from '@/store/chatStore'
import { usePlayerStore } from '@/store/playerStore'
import { useChat } from '../hooks/useChat'

export function ChatWindow() {
  const { messages, messagesLoading, streamingSessionId, activeSessionId } = useChatStore()
  const isStreaming = streamingSessionId === activeSessionId && streamingSessionId !== null
  const { player } = usePlayerStore()
  const { input, setInput, sendMessage } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const quickChips = [
    'Improve skating speed',
    'Prepare for tryout',
    'Summer camp tips',
    'Nutrition advice',
  ]

  const noSession = !activeSessionId

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface2">
      {/* Chat topbar */}
      <header className="h-[60px] flex-shrink-0 bg-surface border-b border-border flex items-center px-5 gap-3">
        <div>
          <div className="font-display text-base font-bold">AI Consultant</div>
          <div className="text-[11.5px] text-accent">● Online</div>
        </div>
        <div className="flex-1" />
        {player && (
          <div className="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-1 text-[12.5px] text-text-2">
            <strong className="text-text">{player.name}</strong>
            &nbsp;·&nbsp;{player.age}&nbsp;·&nbsp;<span className="capitalize">{player.position}</span>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 px-5 flex flex-col gap-5 scrollbar-thin">
        {messagesLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-text-3">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="text-[12px]">Загрузка диалога...</span>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        {isStreaming && (
          <div className="flex gap-2.5">
            <div className="w-[34px] h-[34px] rounded-full bg-surface3 flex items-center justify-center text-xs self-end flex-shrink-0">🤖</div>
            <div className="px-4 py-3 bg-[#1c2030] border border-border rounded-2xl rounded-bl-sm text-[13.5px] leading-relaxed">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>·</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-5 py-3.5 bg-surface border-t border-border">
        <div className="flex gap-2 flex-wrap mb-2.5">
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => !noSession && setInput(chip)}
              disabled={noSession}
              className="h-7 px-3 rounded-full bg-surface3 border border-border text-xs text-text-2 hover:border-accent hover:text-accent hover:bg-accent-dim transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className={`flex items-end gap-2.5 bg-surface2 border rounded-xl px-3 py-2.5 transition-colors ${noSession ? 'border-border opacity-60' : 'border-border focus-within:border-accent'}`}>
          <textarea
            value={input}
            disabled={noSession}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder={noSession ? 'Нажмите New Chat чтобы начать диалог…' : 'Ask about your player\'s development…'}
            className="flex-1 bg-transparent border-none outline-none text-text text-sm resize-none min-h-[22px] max-h-[120px] leading-relaxed placeholder:text-text-3 disabled:cursor-not-allowed"
            rows={1}
          />
          <div className="relative group flex-shrink-0">
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streamingSessionId !== null || noSession}
              className="w-9 h-9 rounded-lg bg-accent text-[#0a1a11] flex items-center justify-center hover:bg-[#30e887] hover:shadow-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
            {noSession && (
              <div className="absolute bottom-full right-0 mb-2 w-52 px-3 py-2 bg-surface border border-border rounded-lg text-[11.5px] text-text-2 shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                Чтобы начать чат, нажмите <span className="text-accent font-semibold">New Chat</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
