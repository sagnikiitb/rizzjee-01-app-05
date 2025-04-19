'use client'

import { CHAT_ID } from '@/lib/constants'
import { Model } from '@/lib/types/models'
import { Message, useChat } from 'ai/react'
import { toast } from 'sonner'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import ChatOutput from './ChatOutput'
import { useEffect, useCallback } from 'react'

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
          messages: messagesToSave
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save messages')
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

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')

  return (
    <div className="flex flex-col w-full max-w-3xl pt-14 pb-40 mx-auto stretch">
      <ChatMessages
        messages={messages}
        data={data}
        onQuerySelect={onQuerySelect}
        isLoading={isLoading}
        chatId={id}
      />
      {!isLoading && lastAssistantMessage && (
        <ChatOutput answer={lastAssistantMessage.content} />
      )}
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
