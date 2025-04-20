'use client'

import { CHAT_ID } from '@/lib/constants'
import { Model } from '@/lib/types/models'
import { Message, useChat } from 'ai/react'
import { toast } from 'sonner'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { useEffect, useCallback, useRef } from 'react'

export function Chat({
  id,
  savedMessages = [],
  query,
  models
}: {
  id: string
  savedMessages?: Message[]
  query?: string
  models?: Model[]
}) {
  const dbInitialized = useRef(false)
  const currentUser = 'sagnikiitb'
  
  // Initialize database on first load
  useEffect(() => {
    const initDatabase = async () => {
      if (dbInitialized.current) return
      
      try {
        const response = await fetch('/api/init-db')
        if (!response.ok) {
          throw new Error('Failed to initialize database')
        }
        dbInitialized.current = true
      } catch (error) {
        console.error('Database initialization failed:', error)
        toast.error('Failed to initialize chat system')
      }
    }

    initDatabase()
  }, [])

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    stop,
    append,
    data,
    setData
  } = useChat({
    initialMessages: savedMessages,
    id: CHAT_ID,
    body: {
      id
    },
    onFinish: async (message) => {
      window.history.replaceState({}, '', `/search/${id}`)
      await saveMessages([...messages, message])
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    }
  })

  const saveMessages = useCallback(async (messagesToSave: Message[]) => {
    try {
      const response = await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: id,
          messages: messagesToSave,
          timestamp: new Date().toISOString(),
          user: currentUser
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        if (data.code === 'DB_NOT_INITIALIZED') {
          await fetch('/api/init-db')
          return await saveMessages(messagesToSave)
        }
        throw new Error(data.error || 'Failed to save messages')
      }
    } catch (error) {
      console.error('Error saving messages:', error)
      toast.error('Failed to save chat messages')
    }
  }, [id])

  // Save messages when component unmounts
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 0) {
        saveMessages(messages)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (messages.length > 0) {
        handleBeforeUnload()
      }
    }
  }, [messages, saveMessages])

  const onQuerySelect = (query: string) => {
    append({
      role: 'user',
      content: query
    })
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined)
    handleSubmit(e)
  }

  return (
    <div className="flex flex-col w-full max-w-3xl pt-14 pb-40 mx-auto stretch">
      <ChatMessages
        messages={messages}
        data={data}
        onQuerySelect={onQuerySelect}
        isLoading={isLoading}
        chatId={id}
      />
      <ChatPanel
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        messages={messages}
        setMessages={setMessages}
        stop={stop}
        query={query}
        append={append}
        models={models}
      />
    </div>
  )
}
