export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  id: string
}

export interface SavedChat {
  id: string
  userId: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}
