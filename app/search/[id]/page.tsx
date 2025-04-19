import { Chat } from '@/components/chat'
import { getChat } from '@/lib/actions/chat'
import { getModels } from '@/lib/config/models'
import { convertToUIMessages } from '@/lib/utils'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'


export const maxDuration = 60

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const chat = await getChat(id, 'anonymous')
  return {
    title: chat?.title.toString().slice(0, 50) || 'Search'
  }
}

export default async function SearchPage(props: {
  params: Promise<{ id: string }>
}) {
  const userId = 'anonymous'
  const { id } = await props.params

  const chat = await getChat(id, userId)
  // convertToUIMessages for useChat hook
  const messages = convertToUIMessages(chat?.messages || [])

  if (!chat) {
    redirect('/')
  }

  if (chat?.userId !== userId) {
    notFound()
  }

  const models = await getModels()
  return <Chat id={id} savedMessages={messages} models={models} />
}


async function loadSavedMessages(chatId: string) {
  try {
    const response = await fetch(`${process.env.VERCEL_URL}/api/chat/load?chatId=${chatId}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to load messages')
    }

    const data = await response.json()
    return data.messages
  } catch (error) {
    console.error('Error loading messages:', error)
    return []
  }
}

export default async function ChatPage({ params }: { params: { id: string } }) {
  const savedMessages = await loadSavedMessages(params.id)

  return (
    <Chat
      id={params.id}
      savedMessages={savedMessages}
    />
  )
}
