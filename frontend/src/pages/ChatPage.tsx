import { ChatHistory } from '@/features/chat/components/ChatHistory'
import { ChatWindow } from '@/features/chat/components/ChatWindow'

export default function ChatPage() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <ChatHistory />
      <ChatWindow />
    </div>
  )
}
